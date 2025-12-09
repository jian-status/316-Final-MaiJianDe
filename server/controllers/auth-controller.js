const auth = require('../auth')
const bcrypt = require('bcryptjs')
const indexModule = require('../index'); // DB instance

// Helper function to get db instance at runtime
const getDb = () => indexModule.db;

getLoggedIn = async (req, res) => {
    try {
        let userId = auth.verifyUser(req);
        if (!userId) {
            return res.status(200).json({
                loggedIn: false,
                user: null,
                errorMessage: "?"
            })
        }

        const loggedInUser = await getDb().getUser(userId);

        return res.status(200).json({
            loggedIn: true,
            user: {
                username: loggedInUser.username,
                email: loggedInUser.email
            }
        })
    } catch (err) {
        console.error("getLoggedIn error:", err);
        res.json(false);
    }
}

loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ errorMessage: "Please enter all required fields." });
        }

        const existingUser = await getDb().getUserByEmail(email);
        if (!existingUser) {
            return res
                .status(401)
                .json({
                    errorMessage: "Wrong email or password provided."
                })
        }

        const passwordCorrect = await bcrypt.compare(password, existingUser.passwordHash);
        if (!passwordCorrect) {
            return res
                .status(401)
                .json({
                    errorMessage: "Wrong email or password provided."
                })
        }

        // LOGIN THE USER
        const token = auth.signToken(existingUser._id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: true
        }).status(200).json({
            success: true,
            user: {
                username: existingUser.username,
                email: existingUser.email              
            }
        })

    } catch (err) {
        console.error("loginUser error:", err);
        res.status(500).send();
    }
}

logoutUser = async (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
        secure: true,
        sameSite: "none"
    }).send();
}

registerUser = async (req, res) => {
    try {
        const { username, email, password, passwordVerify } = req.body;
        if (!username || !email || !password || !passwordVerify) {
            return res
                .status(400)
                .json({ errorMessage: "Please enter all required fields." });
        }
        if (password.length < 8) {
            return res
                .status(400)
                .json({
                    errorMessage: "Please enter a password of at least 8 characters."
                });
        }
        if (password !== passwordVerify) {
            return res
                .status(400)
                .json({
                    errorMessage: "Please enter the same password twice."
                })
        }
        const existingUser = await getDb().getUserByEmail(email);
        if (existingUser) {
            return res
                .status(400)
                .json({
                    success: false,
                    errorMessage: "An account with this email address already exists."
                })
        }

        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const passwordHash = await bcrypt.hash(password, salt);

        const savedUser = await getDb().createUser({username, email, passwordHash});
        console.log("new user saved: " + savedUser._id);

        // LOGIN THE USER
        const token = auth.signToken(savedUser._id);
        console.log("token:" + token);

        await res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        }).status(200).json({
            success: true,
                user: {
                    username: savedUser.username,
                    email: savedUser.email
                }
        })

        console.log("token sent");

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
}

updateUser = async (req, res) => {
    try {
        const userId = auth.verifyUser(req);
        if (!userId) {
            return res.status(401).json({ errorMessage: "Not authenticated" });
        }

        const { username, email, currentPassword, newPassword } = req.body;

        const currentUser = await getDb().getUser(userId);
        if (!currentUser) {
            return res.status(404).json({ errorMessage: "User not found" });
        }

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ errorMessage: "Current password required to change password" });
            }

            const passwordCorrect = await bcrypt.compare(currentPassword, currentUser.passwordHash);
            if (!passwordCorrect) {
                return res.status(400).json({ errorMessage: "Current password is incorrect" });
            }
        }

        if (email && email !== currentUser.email) {
            const existingUser = await getDb().getUserByEmail(email);
            if (existingUser && existingUser._id !== userId) {
                return res.status(400).json({ errorMessage: "Email already in use" });
            }
        }

        const updateData = {};
        if (username && username !== currentUser.username) {
            updateData.username = username;
        }
        if (email && email !== currentUser.email) {
            updateData.email = email;
        }
        if (newPassword) {
            const saltRounds = 10;
            const salt = await bcrypt.genSalt(saltRounds);
            updateData.passwordHash = await bcrypt.hash(newPassword, salt);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ errorMessage: "No changes to update" });
        }

        await getDb().updateUser(userId, updateData);

        const updatedUser = await getDb().getUser(userId);

        res.status(200).json({
            success: true,
            user: {
                username: updatedUser.username,
                email: updatedUser.email
            }
        });

    } catch (err) {
        console.error("updateUser error:", err);
        res.status(500).json({ errorMessage: "Internal server error" });
    }
}

module.exports = {
    getLoggedIn,
    registerUser,
    loginUser,
    logoutUser,
    updateUser
}