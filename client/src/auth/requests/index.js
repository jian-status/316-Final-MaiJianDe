/*
    This is our http api for all things auth, which we use to 
    send authorization requests to our back-end API. 
    
    @author McKilla Gorilla
*/

// THESE ARE ALL THE REQUESTS WE`LL BE MAKING, ALL REQUESTS HAVE A
// REQUEST METHOD (like get) AND PATH (like /register). SOME ALSO
// REQUIRE AN id SO THAT THE SERVER KNOWS ON WHICH LIST TO DO ITS
// WORK, AND SOME REQUIRE DATA, WHICH WE WE WILL FORMAT HERE, FOR WHEN
// WE NEED TO PUT THINGS INTO THE DATABASE OR IF WE HAVE SOME
// CUSTOM FILTERS FOR QUERIES

export const getLoggedIn = () => fetch('http://localhost:4000/auth/loggedIn/', {
    credentials: 'include'
});
export const loginUser = (email, password) => {
    return fetch(`http://localhost:4000/auth/login/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            email : email,
            password : password
        })
    })
}
export const logoutUser = () => fetch('http://localhost:4000/auth/logout/', {
    credentials: 'include',
})
export const registerUser = (firstName, lastName, email, password, passwordVerify) => {
    return fetch('http://localhost:4000/auth/register/', {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include', 
        body: JSON.stringify({
            firstName : firstName,
            lastName : lastName,
            email : email,
            password : password,
            passwordVerify : passwordVerify
        })
    })}

const apis = {
    getLoggedIn,
    registerUser,
    loginUser,
    logoutUser
}

export default apis
