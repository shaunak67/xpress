import { NextResponse } from 'next/server';
import { supabase, initializeDatabase } from '../../../lib/supabase.js';

export async function GET(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  
  try {
    await initializeDatabase();
    
    // Auth endpoints
    if (path === 'auth/user') {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      return NextResponse.json({ user });
    }
    
    // Get all users (for admin dashboard)
    if (path === 'users') {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json(data || []);
    }
    
    // Get user photos with location data
    if (path === 'photos') {
      const { data, error } = await supabase
        .from('photos')
        .select(`
          *,
          users (
            id,
            full_name,
            role
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json(data || []);
    }
    
    // Get GPS tracking data
    if (path === 'gps-tracking') {
      const { data, error } = await supabase
        .from('gps_tracking')
        .select(`
          *,
          users (
            id,
            full_name,
            role
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(100);
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json(data || []);
    }
    
    // Get leads
    if (path === 'leads') {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          users (
            id,
            full_name,
            role
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json(data || []);
    }
    
    return NextResponse.json({ message: 'API endpoint not found' }, { status: 404 });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  
  try {
    const body = await request.json();
    
    // User authentication
    if (path === 'auth/login') {
      const { email, password } = body;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      
      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
      }
      
      return NextResponse.json({ 
        user: data.user, 
        profile: userProfile,
        session: data.session 
      });
    }
    
    // User registration
    if (path === 'auth/register') {
      const { email, password, fullName, role = 'agent' } = body;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      
      // Create user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .insert([{
          id: data.user.id,
          email: email,
          full_name: fullName,
          role: role,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }
      
      return NextResponse.json({ 
        user: data.user, 
        profile: userProfile 
      });
    }
    
    // Upload photo with location
    if (path === 'photos') {
      const { user_id, image_url, latitude, longitude, description } = body;
      
      const { data, error } = await supabase
        .from('photos')
        .insert([{
          user_id: user_id,
          image_url: image_url,
          latitude: latitude,
          longitude: longitude,
          description: description || '',
          created_at: new Date().toISOString()
        }])
        .select(`
          *,
          users (
            id,
            full_name,
            role
          )
        `)
        .single();
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json(data);
    }
    
    // Record GPS tracking
    if (path === 'gps-tracking') {
      const { user_id, latitude, longitude, activity_type = 'active' } = body;
      
      const { data, error } = await supabase
        .from('gps_tracking')
        .insert([{
          user_id: user_id,
          latitude: latitude,
          longitude: longitude,
          activity_type: activity_type,
          timestamp: new Date().toISOString()
        }])
        .select(`
          *,
          users (
            id,
            full_name,
            role
          )
        `)
        .single();
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json(data);
    }
    
    // Create lead
    if (path === 'leads') {
      const { user_id, contact_name, contact_phone, contact_email, business_name, latitude, longitude, notes } = body;
      
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          user_id: user_id,
          contact_name: contact_name,
          contact_phone: contact_phone,
          contact_email: contact_email,
          business_name: business_name,
          latitude: latitude,
          longitude: longitude,
          notes: notes || '',
          created_at: new Date().toISOString()
        }])
        .select(`
          *,
          users (
            id,
            full_name,
            role
          )
        `)
        .single();
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json(data);
    }
    
    return NextResponse.json({ message: 'API endpoint not found' }, { status: 404 });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  
  try {
    const body = await request.json();
    
    // Update user role
    if (path.startsWith('users/') && path.includes('/role')) {
      const userId = path.split('/')[1];
      const { role } = body;
      
      const { data, error } = await supabase
        .from('users')
        .update({ role: role })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json(data);
    }
    
    return NextResponse.json({ message: 'API endpoint not found' }, { status: 404 });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}