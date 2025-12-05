import './App.css';
import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthContextProvider } from './auth';
import { GlobalStoreContextProvider } from './store'
import {
    AppBanner,
    HomeWrapper,
    LoginScreen,
    RegisterScreen,
    Statusbar,
    WorkspaceScreen,
    SongCatalogScreen,
} from './components'
/*
  This is the entry-point for our application. Notice that we
  inject our store into all the components in our application.
  
  @author McKilla Gorilla
*/
const App = () => {   
    return (
        <BrowserRouter>
            <AuthContextProvider>
                <GlobalStoreContextProvider>              
                    <AppBanner />
                    <Routes>
                        <Route path="/" element={<HomeWrapper />} />
                        <Route path="/login/" element={<LoginScreen />} />
                        <Route path="/register/" element={<RegisterScreen />} />
                        <Route path="/playlist/:id" element={<WorkspaceScreen />} />
                        <Route path="/SongCatalogScreen" element={<SongCatalogScreen />} />
                    </Routes>
                    <Statusbar />
                </GlobalStoreContextProvider>
            </AuthContextProvider>
        </BrowserRouter>
    )
}

export default App