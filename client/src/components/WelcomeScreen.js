import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';

export default function WelcomeScreen() {
    const navigate = useNavigate();

    const handleContinueAsGuest = () => {
        navigate('/playlists');
    };

    return (
        <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h3" sx={{ mb: 4, textAlign: 'center' }}>
                    Welcome to Playlister
                </Typography>

                <Typography variant="h6" sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}>
                    Create and manage your music playlists
                </Typography>

                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleContinueAsGuest}
                        sx={{ py: 1.5 }}
                    >
                        Continue as Guest
                    </Button>

                    <Button
                        variant="outlined"
                        size="large"
                        component={Link}
                        to="/login"
                        sx={{ py: 1.5 }}
                    >
                        Login
                    </Button>

                    <Button
                        variant="outlined"
                        size="large"
                        component={Link}
                        to="/register"
                        sx={{ py: 1.5 }}
                    >
                        Sign Up
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}