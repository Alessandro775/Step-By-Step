import React from 'react';

const ProfilePage = () => {
    return (
        <div className="profile-container">
            <h1>User Profile</h1>
            <div className="profile-content">
                <div className="profile-section">
                    <h2>Personal Information</h2>
                    <div className="profile-info">
                        <p><strong>Name:</strong> John Doe</p>
                        <p><strong>Email:</strong> john.doe@example.com</p>
                        <p><strong>Location:</strong> New York, USA</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;