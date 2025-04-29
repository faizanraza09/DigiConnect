const checkUserType = (allowedTypes) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            if (!allowedTypes.includes(req.user.userType)) {
                return res.status(403).json({ 
                    message: `Access denied. This route is only accessible to: ${allowedTypes.join(', ')}` 
                });
            }

            next();
        } catch (error) {
            console.error('User type check error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};

module.exports = checkUserType; 