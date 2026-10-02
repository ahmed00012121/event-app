const authorize = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user && req.user.role ? req.user.role : 'unknown';
        if (!roles.includes(userRole)) {
            return res.status(403).json({ message: `Forbidden: Access denied (required: ${roles.join(',')}; your role: ${userRole})` });
        }
        next();
    };
};

module.exports = { authorize };
