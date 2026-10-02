const Event = require('../models/event');

// Helper to format errors
const handleError = (err) => {
    console.error('Error details:', err);

    if (!err) {
        return { error: 'Unknown error' };
    }

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return { error: errors.join(', ') };
    }

    return { error: err.message || String(err) };
};

const eventController = {

    // Create event
    createEvent: async (req, res) => {
        try {
            console.log('Creating event with data:', {
                body: req.body,
                file: req.file
            });

            // Store the uploaded event banner when a file is provided.
            if (req.file) {
                req.body.eventBanner = req.file.path || req.file.filename;
            }

            // Convert date strings into JavaScript Date objects.
            if (req.body.startDateTime) {
                req.body.startDateTime = new Date(req.body.startDateTime);
            }

            if (req.body.endDateTime) {
                req.body.endDateTime = new Date(req.body.endDateTime);
            }

            // Make sure a newly created event starts with no registrations.
            // Registrations will be added later when students register.
            if (!req.body.registrations) {
                req.body.registrations = [];
            }

            const event = new Event(req.body);

            await event.save();

            res.status(201).json(event);

        } catch (err) {
            res.status(400).json(handleError(err));
        }
    },

    // List events
    getAllEvents: async (req, res) => {
        try {
            const {
                category,
                status,
                eventMode,
                visibility,
                start,
                end
            } = req.query;

            const filter = {};

            if (category) filter.category = category;
            if (status) filter.status = status;
            if (eventMode) filter.eventMode = eventMode;
            if (visibility) filter.visibility = visibility;

            if (start || end) {
                filter.startDateTime = {};

                if (start) {
                    filter.startDateTime.$gte = new Date(start);
                }

                if (end) {
                    filter.startDateTime.$lte = new Date(end);
                }
            }

            const events = await Event
                .find(filter)
                .sort({ startDateTime: 1 });

            res.json(events);

        } catch (err) {
            res.status(500).json(handleError(err));
        }
    },

    // Get single event
    getEventById: async (req, res) => {
        try {
            const event = await Event.findById(req.params.id);

            if (!event) {
                return res.status(404).json({
                    error: 'Event not found'
                });
            }

            res.json(event);

        } catch (err) {
            res.status(500).json(handleError(err));
        }
    },

    // Update event
    updateEvent: async (req, res) => {
        try {
            // Store the new event banner when a file is uploaded.
            if (req.file) {
                req.body.eventBanner =
                    req.file.path || req.file.filename;
            }

            // Convert date strings into Date objects.
            if (req.body.startDateTime) {
                req.body.startDateTime =
                    new Date(req.body.startDateTime);
            }

            if (req.body.endDateTime) {
                req.body.endDateTime =
                    new Date(req.body.endDateTime);
            }

            // Remove empty registration values.
            // MongoDB ObjectId fields cannot contain an empty string.
            if (Array.isArray(req.body.registrations)) {
                req.body.registrations =
                    req.body.registrations.filter(
                        (id) => id && String(id).trim() !== ''
                    );
            }

            const event = await Event.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!event) {
                return res.status(404).json({
                    error: 'Event not found'
                });
            }

            res.json(event);

        } catch (err) {
            res.status(400).json(handleError(err));
        }
    },

    // Delete event
    deleteEvent: async (req, res) => {
        try {
            const event =
                await Event.findByIdAndDelete(req.params.id);

            if (!event) {
                return res.status(404).json({
                    error: 'Event not found'
                });
            }

            res.json({
                message: 'Event deleted'
            });

        } catch (err) {
            res.status(500).json(handleError(err));
        }
    }
};

module.exports = eventController;

