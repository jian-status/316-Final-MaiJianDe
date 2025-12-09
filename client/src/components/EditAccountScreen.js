import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../auth';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';

export default function EditAccountScreen() {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    const [username, setUsername] = useState(auth.user ? auth.user.username : '');
    const [email, setEmail] = useState(auth.user ? auth.user.email : '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Clear previous messages
        setErrorMessage('');
        setSuccessMessage('');

        // Basic validation
        if (!username.trim() || !email.trim()) {
            setErrorMessage('Username and email are required');
            return;
        }

        if (newPassword && newPassword !== confirmPassword) {
            setErrorMessage('New passwords do not match');
            return;
        }

        if (newPassword && !currentPassword) {
            setErrorMessage('Current password is required to change password');
            return;
        }

        try {
            const result = await auth.updateUser(username, email, currentPassword, newPassword);
            if (result.success) {
                setSuccessMessage('Account updated successfully!');
                // Clear password fields
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setErrorMessage(result.error);
            }
        } catch (error) {
            setErrorMessage('Failed to update account');
        }
    };

    // Redirect if not logged in
    if (!auth.loggedIn) {
        navigate('/login');
        return null;
    }

    return (
        <Container component="main" maxWidth="sm">
            <CssBaseline />
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    {/* You can add an icon here if desired */}
                </Avatar>
                <Typography component="h1" variant="h5">
                    Edit Account
                </Typography>

                {errorMessage && (
                    <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                        {errorMessage}
                    </Alert>
                )}

                {successMessage && (
                    <Alert severity="success" sx={{ width: '100%', mt: 2 }}>
                        {successMessage}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="currentPassword"
                                label="Current Password (required for password change)"
                                name="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="newPassword"
                                label="New Password (leave blank to keep current)"
                                name="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="confirmPassword"
                                label="Confirm New Password"
                                name="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </Grid>
                    </Grid>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, bgcolor: '#9333ea', '&:hover': { bgcolor: '#7c3aed' } }}
                    >
                        Save Changes
                    </Button>
                    <Grid container justifyContent="flex-end">
                        <Grid item>
                            <Link href="#" variant="body2" onClick={() => navigate('/')}>
                                Back to Home
                            </Link>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </Container>
    );
}