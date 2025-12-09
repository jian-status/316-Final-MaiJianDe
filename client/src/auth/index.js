import React, { createContext, useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom'
import authRequestSender from './requests'
import { GlobalStoreContext } from '../store';

const AuthContext = createContext();

// THESE ARE ALL THE TYPES OF UPDATES TO OUR AUTH STATE THAT CAN BE PROCESSED
export const AuthActionType = {
    GET_LOGGED_IN: "GET_LOGGED_IN",
    LOGIN_USER: "LOGIN_USER",
    LOGOUT_USER: "LOGOUT_USER",
    REGISTER_USER: "REGISTER_USER"
}

function AuthContextProvider(props) {
    const [auth, setAuth] = useState({
        user: null,
        loggedIn: false,
        errorMessage: null,
        isAuthReady: false
    });
    const navigate = useNavigate();
    const { store } = React.useContext(GlobalStoreContext);

    useEffect(() => {
        auth.getLoggedIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Disable eslint warning for this line

    const authReducer = (action) => {
        const { type, payload } = action;
        switch (type) {
            case AuthActionType.GET_LOGGED_IN: {
                return setAuth({
                    user: payload.user,
                    loggedIn: payload.loggedIn,
                    errorMessage: null,
                    isAuthReady: true
                });
            }
            case AuthActionType.LOGIN_USER: {
                return setAuth({
                    user: payload.user,
                    loggedIn: payload.loggedIn,
                    errorMessage: payload.errorMessage,
                    isAuthReady: true
                })
            }
            case AuthActionType.LOGOUT_USER: {
                return setAuth({
                    user: null,
                    loggedIn: false,
                    errorMessage: null,
                    isAuthReady: true
                })
            }
            case AuthActionType.REGISTER_USER: {
                return setAuth({
                    user: payload.user,
                    loggedIn: payload.loggedIn,
                    errorMessage: payload.errorMessage,
                    isAuthReady: true
                })
            }
            default:
                return auth;
        }
    }

    auth.getLoggedIn = async function () {
        const response = await authRequestSender.getLoggedIn();
        if (response.status === 200) {
            const data = await response.json();
            authReducer({
                type: AuthActionType.GET_LOGGED_IN,
                payload: {
                    loggedIn: data.loggedIn,
                    user: data.user
                }
            });
            if (data.loggedIn && store) {
                store.loadIdNamePairs();
            }
        }
    }

    auth.registerUser = async function(username, email, password, passwordVerify) {
        try{   
            const response = await authRequestSender.registerUser(username, email, password, passwordVerify);   
            if (response.status === 201) {
                const data = await response.json();
                authReducer({
                    type: AuthActionType.REGISTER_USER,
                    payload: {
                        user: null,
                        loggedIn: false,
                        errorMessage: null
                    }
                })
                navigate("/login");
            } else if (response.status === 400) {
                const errorData = await response.json();
                authReducer({
                    type: AuthActionType.REGISTER_USER,
                    payload: {
                        user: auth.user,
                        loggedIn: false,
                        errorMessage: errorData.error || "Registration failed"
                    }
                })
            } else {
                authReducer({
                    type: AuthActionType.REGISTER_USER,
                    payload: {
                        user: auth.user,
                        loggedIn: false,
                        errorMessage: "Registration failed"
                    }
                })
            }
        } catch(error){
            console.error("Registration error:", error);
            authReducer({
                type: AuthActionType.REGISTER_USER,
                payload: {
                    user: auth.user,
                    loggedIn: false,
                    errorMessage: "Registration failed"
                }
            })
        }
    }

    auth.loginUser = async function(email, password) {
        try{
            const response = await authRequestSender.loginUser(email, password);
            if (response.status === 200) {
                const data = await response.json();
                authReducer({
                    type: AuthActionType.LOGIN_USER,
                    payload: {
                        user: data.user,
                        loggedIn: true,
                        errorMessage: null
                    }
                })
                // Load the user's playlists after login
                if (store) store.loadIdNamePairs();
                navigate("/playlists");
            }
        } catch(error){
            authReducer({
                type: AuthActionType.LOGIN_USER,
                payload: {
                    user: auth.user,
                    loggedIn: false,
                    errorMessage: "Login failed"
                }
            })
        }
    }

    auth.logoutUser = async function() {
        const response = await authRequestSender.logoutUser();
        if (response.status === 200) {
            authReducer( {
                type: AuthActionType.LOGOUT_USER,
                payload: null
            })
            sessionStorage.clear();
            navigate("/");
        }
    }

    auth.updateUser = async function(username, email, currentPassword, newPassword) {
        try {
            const response = await authRequestSender.updateUser(username, email, currentPassword, newPassword);
            if (response.status === 200) {
                const data = await response.json();
                authReducer({
                    type: AuthActionType.LOGIN_USER, // Reuse login action to update user data
                    payload: {
                        user: data.user,
                        loggedIn: true,
                        errorMessage: null
                    }
                });
                return { success: true };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.errorMessage };
            }
        } catch (error) {
            console.error("Update user error:", error);
            return { success: false, error: "Update failed" };
        }
    }

    auth.getUserInitials = function() {
        let initials = "";
        if (auth.user && auth.user.username && auth.user.username.length > 0) {
            initials += auth.user.username.charAt(0);
            // if username includes a separator (like a space), consider second initial
            if (auth.user.username.includes(' ')) {
                const parts = auth.user.username.split(' ');
                if (parts.length > 1 && parts[1].length > 0) initials += parts[1].charAt(0);
            } else if (auth.user.username.length > 1) {
                // include second char for better initials when username is one word
                initials += auth.user.username.charAt(1);
            }
        }
        // user initials computed
        return initials;
    }

    return (
        <AuthContext.Provider value={{
            auth
        }}>
            {props.children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
export { AuthContextProvider };