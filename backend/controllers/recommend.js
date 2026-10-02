const Event = require('../models/event');
const Student = require('../models/student');
const Reg = require('../models/reg');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Recommendation controller
 * Gets user's past events and generates smart recommendations
 */
const recommendEvents = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log('[RECOMMEND] Fetching recommendations for user:', userId);

        // Get user's registration history
        const userRegistrations = await Reg.find({ student: userId })
            .populate('event')
            .limit(20)
            .sort({ registeredAt: -1 });

        console.log('[RECOMMEND] User registrations:', userRegistrations.length);

        // Get all upcoming events
        const upcomingEvents = await Event.find({
            startDateTime: { $gte: new Date() }
        })
            .sort({ startDateTime: 1 })
            .limit(50);

        console.log('[RECOMMEND] Upcoming events:', upcomingEvents.length);

        if (upcomingEvents.length === 0) {
            console.log('[RECOMMEND] No upcoming events found — falling back to all events for recommendations (dev-mode)');
            // Fallback: include recent events (past or future) so the UI has data during testing
            const fallbackEvents = await Event.find()
                .sort({ startDateTime: -1 })
                .limit(50);

            if (!fallbackEvents || fallbackEvents.length === 0) {
                console.log('[RECOMMEND] Fallback: still no events in DB');
                return res.json([]);
            }

            // Use fallbackEvents as upcomingEvents for downstream processing
            upcomingEvents.splice(0, upcomingEvents.length, ...fallbackEvents);
        }

        // Prepare data for Python recommendation engine
        const pastEvents = userRegistrations
            .map(reg => reg.event)
            .filter(event => event)
            .map(event => ({
                id: event._id.toString(),
                title: event.title,
                description: event.description,
                category: event.category,
                date: event.startDateTime,
                location: event.venueOrLink,
                tags: event.tags || []
            }));

        const allUpcomingEvents = upcomingEvents.map(event => ({
            id: event._id.toString(),
            title: event.title,
            description: event.description,
            category: event.category,
            date: event.startDateTime,
            location: event.venueOrLink,
            tags: event.tags || [],
            popularity: event.popularity || 0,
            registrationCount: event.registrations ? event.registrations.length : 0
        }));

        console.log('[RECOMMEND] Past events for analysis:', pastEvents.length);
        console.log('[RECOMMEND] Upcoming events to analyze:', allUpcomingEvents.length);

        // Call Python recommendation engine
        const recommendations = await callRecommendationEngine(pastEvents, allUpcomingEvents);

        console.log('[RECOMMEND] Generated recommendations:', recommendations.length);

        // Enrich recommendations with full event data
        const enrichedRecommendations = recommendations.map(rec => {
            const fullEvent = upcomingEvents.find(e => e._id.toString() === rec.id);
            return fullEvent ? {
                _id: fullEvent._id,
                title: fullEvent.title,
                description: fullEvent.description,
                category: fullEvent.category,
                date: fullEvent.startDateTime,
                location: fullEvent.venueOrLink,
                eventBanner: fullEvent.eventBanner,
                maxParticipants: fullEvent.maxParticipants,
                registrationCount: fullEvent.registrations ? fullEvent.registrations.length : 0,
                tags: fullEvent.tags || [],
                score: rec.score || 0
            } : null;
        }).filter(rec => rec !== null);

        console.log('[RECOMMEND] Enriched recommendations:', enrichedRecommendations.length);
        res.json(enrichedRecommendations);

    } catch (err) {
        console.error('[RECOMMEND] Error:', err.message);
        res.status(500).json({
            message: 'Could not generate recommendations',
            error: err.message
        });
    }
};

/**
 * Call Python recommendation engine
 */
function callRecommendationEngine(pastEvents, upcomingEvents) {
    return new Promise((resolve, reject) => {
        const inputData = {
            pastEvents: pastEvents,
            upcomingEvents: upcomingEvents
        };

        const scriptPath = path.resolve(__dirname, '..', 'ai', 'recommend.py');
        console.log('[RECOMMEND] Python script path:', scriptPath);

        if (!fs.existsSync(scriptPath)) {
            console.warn('[RECOMMEND] Python script not found, returning all upcoming events');
            // Fallback: return all upcoming events if script not found
            const fallback = upcomingEvents.slice(0, 8).map((event, idx) => ({
                id: event.id,
                title: event.title,
                description: event.description,
                date: event.date,
                location: event.location,
                score: 1.0 - (idx * 0.1)
            }));
            return resolve(fallback);
        }

        try {
            const python = spawn('python', [scriptPath], {
                env: Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' }),
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 15000
            });

            let output = '';
            let errorOutput = '';

            python.stdin.write(JSON.stringify(inputData));
            python.stdin.end();

            python.stdout.on('data', (data) => {
                output += data.toString();
            });

            python.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    console.error('[RECOMMEND] Python process error:', errorOutput);
                    // Fallback to all upcoming events
                    const fallback = upcomingEvents.slice(0, 8).map((event, idx) => ({
                        id: event.id,
                        title: event.title,
                        description: event.description,
                        date: event.date,
                        location: event.location,
                        score: 1.0 - (idx * 0.1)
                    }));
                    return resolve(fallback);
                }

                try {
                    const recommendations = JSON.parse(output.trim());
                    console.log('[RECOMMEND] Python engine returned:', recommendations.length, 'recommendations');
                    resolve(recommendations);
                } catch (parseError) {
                    console.error('[RECOMMEND] Failed to parse Python output:', parseError.message);
                    // Fallback
                    const fallback = upcomingEvents.slice(0, 8).map((event, idx) => ({
                        id: event.id,
                        title: event.title,
                        description: event.description,
                        date: event.date,
                        location: event.location,
                        score: 1.0 - (idx * 0.1)
                    }));
                    resolve(fallback);
                }
            });

            python.on('error', (err) => {
                console.error('[RECOMMEND] Failed to spawn Python process:', err.message);
                // Fallback
                const fallback = upcomingEvents.slice(0, 8).map((event, idx) => ({
                    id: event.id,
                    title: event.title,
                    description: event.description,
                    date: event.date,
                    location: event.location,
                    score: 1.0 - (idx * 0.1)
                }));
                resolve(fallback);
            });

        } catch (err) {
            console.error('[RECOMMEND] Error calling recommendation engine:', err.message);
            const fallback = upcomingEvents.slice(0, 8).map((event, idx) => ({
                id: event.id,
                title: event.title,
                description: event.description,
                date: event.date,
                location: event.location,
                score: 1.0 - (idx * 0.1)
            }));
            resolve(fallback);
        }
    });
}

module.exports = { recommendEvents };

