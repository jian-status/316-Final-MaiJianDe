const auth = require('../auth')
const bcrypt = require('bcryptjs')
const indexModule = require('../index'); // DB instance

// Helper function to get db instance at runtime
const getDb = () => indexModule.db;

/*
    This is our back-end API. It provides all the data services
    our database needs. Note that this file contains the controller
    functions for each endpoint.

    @author McKilla Gorilla
*/
const getLoggedIn = async (req, res) => {
    try {
        const userId = auth.verifyUser(req);

        if (!userId) {
            return res.status(200).json({
                loggedIn: false,
                user: null
            });
        }

        const loggedInUser = await getDb().getUser(userId);
        if (!loggedInUser) {
            return res.status(200).json({
                loggedIn: false,
                user: null
            });
        }

        return res.status(200).json({
            loggedIn: true,
            user: {
                username: loggedInUser.username,
                email: loggedInUser.email
            }
        });

    } catch (error) {
        console.error('Error checking logged-in status:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while checking authentication status'
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a valid email address'
            });
        }

        // Find user by email
        const existingUser = await getDb().getUserByEmail(email.toLowerCase());
        if (!existingUser) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Verify password
        const passwordCorrect = await bcrypt.compare(password, existingUser.passwordHash);
        if (!passwordCorrect) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = auth.signToken(existingUser._id);

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        return res.status(200).json({
            success: true,
            user: {
                username: existingUser.username,
                email: existingUser.email
            }
        });

    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error during login'
        });
    }
};

/**
 * Logout user by clearing authentication cookie
 * POST /api/auth/logout
 */
const logoutUser = async (req, res) => {
    try {
        res.cookie('token', '', {
            httpOnly: true,
            expires: new Date(0),
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Error during logout:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error during logout'
        });
    }
};

/**
 * Register a new user account
 * POST /api/auth/register
 */
const registerUser = async (req, res) => {
    try {
        const { username, email, password, passwordVerify } = req.body;

        // Validate required fields
        if (!username || !email || !password || !passwordVerify) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required: username, email, password, and password verification'
            });
        }

        // Validate username
        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({
                success: false,
                error: 'Username must be between 3 and 30 characters'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a valid email address'
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters long'
            });
        }

        // Check password complexity (optional but recommended)
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
            return res.status(400).json({
                success: false,
                error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            });
        }

        // Verify passwords match
        if (password !== passwordVerify) {
            return res.status(400).json({
                success: false,
                error: 'Passwords do not match'
            });
        }

        // Check if user already exists
        const existingUser = await getDb().getUserByEmail(email.toLowerCase());
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'An account with this email address already exists'
            });
        }

        // Hash password
        const saltRounds = 12; // Increased for better security
        const salt = await bcrypt.genSalt(saltRounds);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await getDb().createUser({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            passwordHash
        });

        // Generate JWT token
        const token = auth.signToken(newUser._id);

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        return res.status(201).json({
            success: true,
            user: {
                username: newUser.username,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error during registration'
        });
    }
};

/**
 * Update user account information
 * PUT /api/auth/user
 */
const updateUser = async (req, res) => {
    try {
        // Verify authentication
        const userId = auth.verifyUser(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const { username, email, currentPassword, newPassword } = req.body;

        // Get current user
        const currentUser = await getDb().getUser(userId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Validate password change requirements
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Current password is required to set a new password'
                });
            }

            // Verify current password
            const passwordCorrect = await bcrypt.compare(currentPassword, currentUser.passwordHash);
            if (!passwordCorrect) {
                return res.status(400).json({
                    success: false,
                    error: 'Current password is incorrect'
                });
            }

            // Validate new password
            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    error: 'New password must be at least 8 characters long'
                });
            }
        }

        // Validate email uniqueness if changing
        if (email && email.toLowerCase() !== currentUser.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    error: 'Please enter a valid email address'
                });
            }

            const existingUser = await getDb().getUserByEmail(email.toLowerCase());
            if (existingUser && existingUser._id.toString() !== userId) {
                return res.status(409).json({
                    success: false,
                    error: 'Email address is already in use'
                });
            }
        }

        // Validate username if changing
        if (username && username !== currentUser.username) {
            if (username.length < 3 || username.length > 30) {
                return res.status(400).json({
                    success: false,
                    error: 'Username must be between 3 and 30 characters'
                });
            }
        }

        // Prepare update data
        const updateData = {};

        if (username && username !== currentUser.username) {
            updateData.username = username.trim();
        }

        if (email && email.toLowerCase() !== currentUser.email) {
            updateData.email = email.toLowerCase().trim();
        }

        if (newPassword) {
            const saltRounds = 12;
            const salt = await bcrypt.genSalt(saltRounds);
            updateData.passwordHash = await bcrypt.hash(newPassword, salt);
        }

        // Check if there are any changes
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No changes to update'
            });
        }

        // Update user
        await getDb().updateUser(userId, updateData);

        // Get updated user data
        const updatedUser = await getDb().getUser(userId);

        return res.status(200).json({
            success: true,
            user: {
                username: updatedUser.username,
                email: updatedUser.email
            }
        });

    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while updating user account'
        });
    }
};

module.exports = {
    getLoggedIn,
    registerUser,
    loginUser,
    logoutUser,
    updateUser
}