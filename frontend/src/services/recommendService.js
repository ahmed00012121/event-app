import api from './api';

const validateEvent = (event) => {
    if (!event || typeof event !== 'object') return null;
    
    // Essential fields
    if (!event._id && !event.id) return null;
    if (!event.title) return null;
    
    return {
        _id: event._id || event.id,
        title: event.title.trim(),
        description: event.description ? event.description.trim() : 'No description available',
        date: event.date ? new Date(event.date).toISOString() : new Date().toISOString(),
        location: event.location ? event.location.trim() : 'Location TBA',
        category: event.category || 'Uncategorized',
        capacity: event.capacity || null,
        registrationDeadline: event.registrationDeadline || null
    };
};

const recommendService = {
    // Get event recommendations for current student
    getRecommendations: async () => {
        try {
            console.log('Making request to /recommend endpoint...');
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            const res = await api.post('/recommend', {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                timeout: 10000 // 10 second timeout
            });
            
            console.log('Raw response:', res);
            
            if (!res.data) {
                console.warn('No data in response');
                return [];
            }
            
            // Normalize the response data
            let rawEvents = [];
            if (Array.isArray(res.data)) {
                rawEvents = res.data;
            } else if (res.data.recommendations && Array.isArray(res.data.recommendations)) {
                rawEvents = res.data.recommendations;
            } else if (typeof res.data === 'object') {
                rawEvents = [res.data];
            }
            
            // Validate and transform events
            const validEvents = rawEvents
                .map(validateEvent)
                .filter(event => event !== null);
            
            console.log(`Processed ${rawEvents.length} events, ${validEvents.length} valid`);
            
            if (validEvents.length === 0) {
                console.warn('No valid events found in response');
            }
            
            return validEvents;
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
            
            // Enhance error object with user-friendly message
            const enhancedError = new Error(error.message);
            enhancedError.userMessage = error.response?.data?.message || 
                'Unable to load recommendations. Please try again later.';
            enhancedError.status = error.response?.status;
            enhancedError.originalError = error;
            
            throw enhancedError;
        }
    }
};

export default recommendService;