import React, { createContext, useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom'
import authRequestSender from './requests'

const AuthContext = createContext();
console.log("create AuthContext: " + AuthContext);

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
        }
    }

    auth.registerUser = async function(username, email, password, passwordVerify) {
        console.log("REGISTERING USER");
        try{   
            const response = await authRequestSender.registerUser(username, email, password, passwordVerify);   
            if (response.status === 200) {
                const data = await response.json();
                console.log("Registered User");
                authReducer({
                    type: AuthActionType.REGISTER_USER,
                    payload: {
                        user: data.user,
                        loggedIn: true,
                        errorMessage: null
                    }
                })
                navigate("/login");
                console.log("NOW WE LOGIN");
                auth.loginUser(email, password);
                console.log("LOGGED IN");
            }
        } catch(error){
            console.log("Registration error:", error);
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
                navigate("/");
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
            navigate("/");
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
        console.log("user initials: " + initials);
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