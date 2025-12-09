import { useContext, useState } from 'react';
import AuthContext from '../auth';
import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export default function EditAccountModal() {
    const { auth } = useContext(AuthContext);
    const [open, setOpen] = useState(false);
    const [username, setUsername] = useState(auth.user ? auth.user.username : '');
    const [email, setEmail] = useState(auth.user ? auth.user.email : '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setErrorMessage('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleSave = async () => {
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
                handleClose();
            } else {
                setErrorMessage(result.error);
            }
        } catch (error) {
            setErrorMessage('Failed to update account');
        }
    };

    // Make this function available globally so AppBanner can call it
    React.useEffect(() => {
        window.openEditAccountModal = handleOpen;
    }, []);

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="edit-account-modal"
        >
            <Box sx={style}>
                <Typography id="edit-account-modal" variant="h6" component="h2" sx={{ mb: 2 }}>
                    Edit Account
                </Typography>

                {errorMessage && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errorMessage}
                    </Alert>
                )}

                <TextField
                    fullWidth
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Current Password (required for password change)"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="New Password (leave blank to keep current)"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>Save Changes</Button>
                </Box>
            </Box>
        </Modal>
    );
}