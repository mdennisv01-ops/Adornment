'use client';
import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function AdminProfile() {
  const [profile, setProfile] = useState({ name: '', username: '', email: '', phone: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('adornment_staff_access_token')) { location.href = '/admin/login'; return; }
    api('/users/me', { staff: true }).then((data) => setProfile({ name: data.name || '', username: data.username || '', email: data.email || '', phone: data.phone || '' })).catch((e) => setError(e.message));
  }, []);

  async function saveProfile(e) {
    e.preventDefault(); setError(''); setMessage('');
    try {
      const details = { name: profile.name, username: profile.username, email: profile.email };
      if (profile.phone?.trim()) details.phone = profile.phone.trim();
      const data = await api('/users/staff/me', { staff: true, method: 'PATCH', body: JSON.stringify(details) });
      setProfile({ name: data.name || '', username: data.username || '', email: data.email || '', phone: data.phone || '' });
      localStorage.setItem('adornment_staff_name', data.name || 'Merchant');
      setMessage('Personal details updated.');
    } catch (e) { setError(e.message); }
  }

  async function submitPassword(e) {
    e.preventDefault(); setError(''); setMessage('');
    if (passwords.newPassword !== passwords.confirmPassword) { setError('New passwords do not match'); return; }
    try {
      await api('/users/staff/me/password', { staff: true, method: 'POST', body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }) });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Password updated successfully.');
    } catch (e) { setError(e.message); }
  }

  return <>
    <div className="admin-top"><div><div className="eyebrow">Account</div><h1>Profile & security</h1></div></div>
    {message && <p style={{ color: '#2f6b4f' }}>{message}</p>}
    {error && <p style={{ color: '#a33' }}>{error}</p>}
    <form className="admin-content" onSubmit={saveProfile} style={{ marginBottom: 16 }}>
      <div className="admin-toolbar"><h2 style={{ font: '20px var(--serif)', margin: 0 }}>Personal credentials</h2><button className="admin-btn">Save details</button></div>
      <div className="admin-form-grid admin-form-grid-two">
        <label>Name<input value={profile.name} minLength={2} required onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
        <label>Username<input value={profile.username} minLength={3} required onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase() })} /></label>
        <label>Email<input type="email" value={profile.email} required onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></label>
        <label>Phone<input value={profile.phone || ''} minLength={7} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></label>
      </div>
    </form>
    <form className="admin-content" onSubmit={submitPassword}>
      <div className="admin-toolbar"><h2 style={{ font: '20px var(--serif)', margin: 0 }}>Change password</h2><button className="admin-btn">Update password</button></div>
      <div className="admin-form-grid admin-form-grid-three">
        <label>Current password<input type="password" autoComplete="current-password" value={passwords.currentPassword} required onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} /></label>
        <label>New password<input type="password" autoComplete="new-password" minLength={12} maxLength={72} value={passwords.newPassword} required onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} /></label>
        <label>Confirm password<input type="password" autoComplete="new-password" minLength={12} maxLength={72} value={passwords.confirmPassword} required onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} /></label>
      </div>
    </form>
  </>;
}
