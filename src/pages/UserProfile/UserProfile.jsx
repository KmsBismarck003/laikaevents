import React, { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { useNotification } from '../../context/NotificationContext'
import { useAuth } from '../../context/AuthContext'
import Icon from '../../components/Icons'
import '../admin/AdminDashboard.css'

const API_HOST = process.env.REACT_APP_API_HOST || 'http://localhost:8000'

export default function UserProfile() {
  const { success, error: showError } = useNotification()
  const { user: cu, updateUser } = useAuth()
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [savedOk, setSavedOk]   = useState(false)
  const [avatarHover, setAvatarHover] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef(null)

  const [data, setData] = useState({
    firstName:'', lastName:'', email:'', phone:'', birthDate:'', profilePhoto:''
  })

  useEffect(() => {
    ;(async () => {
      try {
        const r = await api.user.getProfile()
        const profile = {
          firstName:    r.firstName||r.first_name||'',
          lastName:     r.lastName||r.last_name||'',
          email:        r.email||'',
          phone:        r.phone||'',
          birthDate:    r.birthDate||r.birth_date||'',
          profilePhoto: r.avatarUrl||r.avatar_url||r.profile_photo||r.profilePhoto||''
        }
        setData(profile)
        // Sincronizar con el estado global (navbar)
        updateUser({ 
          firstName: profile.firstName, 
          lastName: profile.lastName, 
          avatarUrl: profile.profilePhoto 
        })
      } catch (err) {
        console.error("Error fetching profile:", err)
        if (cu) setData(p => ({
          ...p, firstName:cu.firstName||'', lastName:cu.lastName||'', email:cu.email||''
        }))
      } finally { setLoading(false) }
    })()
  }, [])

  const handleChange = e => {
    setData(p => ({ ...p, [e.target.name]: e.target.value }))
    setSavedOk(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.user.updateProfile({
        first_name: data.firstName, last_name: data.lastName,
        email: data.email, phone: data.phone, birth_date: data.birthDate
      })
      updateUser({ firstName: data.firstName, lastName: data.lastName })
      setSavedOk(true)
      success('¡Perfil guardado!')
      setTimeout(() => setSavedOk(false), 3000)
    } catch (err) { showError(err.message||'Error al guardar') }
    finally { setSaving(false) }
  }

  const handlePhotoClick  = () => fileInputRef.current?.click()
  const handlePhotoChange = async e => {
    const file = e.target.files[0]; if (!file) return
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { showError('Usa JPG, PNG o WebP'); return }
    if (file.size > 5*1024*1024) { showError('Máximo 5MB'); return }
    setUploadingPhoto(true)
    
    // Instant local preview
    const reader = new FileReader()
    reader.onload = e => setData(p => ({ ...p, profilePhoto: e.target.result }))
    reader.readAsDataURL(file)

    try {
      const r = await api.user.uploadPhoto(file)
      const newAvatarUrl = r.avatarUrl||r.avatar_url
      setData(p => ({ ...p, profilePhoto: newAvatarUrl }))
      // Forzar actualización inmediata en el navbar (global state)
      updateUser({ avatarUrl: newAvatarUrl })
      success('Foto actualizada')
    } catch (err) { 
      showError(err.message||'Error al subir')
      // Try to revert or just clean up
      try {
        const r = await api.user.getProfile()
        setData(p => ({ ...p, profilePhoto: r.avatarUrl||r.avatar_url }))
      } catch (e) {
        console.error("Critical: Could not revert profile", e)
      }
    }
    finally { setUploadingPhoto(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }
  const handleDeletePhoto = async () => {
    try { 
      await api.user.deletePhoto()
      setData(p=>({...p,profilePhoto:''}))
      updateUser({ avatarUrl: '' })
      success('Foto eliminada') 
    }
    catch { showError('Error al eliminar la foto') }
  }

  const initials = () => ((data.firstName?.[0]||'')+(data.lastName?.[0]||'')).toUpperCase()||'U'
  const photoUrl = !data.profilePhoto ? null
    : (data.profilePhoto.startsWith('http') || data.profilePhoto.startsWith('data:')) ? data.profilePhoto
    : `${API_HOST}${data.profilePhoto}`

  if (loading) return <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
    {[1,2].map(i=><div key={i} className="skeleton" style={{height:'90px',borderRadius:'16px'}}/>)}</div>

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>

      {/* ─── AVATAR CARD ─────────────────────────────────────── */}
      <div style={{
        background:'linear-gradient(135deg,#0f172a 0%,#0d1b2a 100%)',
        border:'1px solid rgba(255,255,255,.07)',
        borderRadius:'20px', padding:'2rem',
        display:'flex', alignItems:'center', gap:'1.5rem',
        boxShadow:'0 8px 32px rgba(0,0,0,.4)',
        position:'relative', overflow:'hidden'
      }}>
        {/* glow orb */}
        <div style={{position:'absolute',top:'-60px',right:'-60px',width:'200px',height:'200px',
          background:'radial-gradient(circle,rgba(0,112,243,.18) 0%,transparent 70%)',pointerEvents:'none'}}/>

        {/* Avatar */}
        <div style={{position:'relative',flexShrink:0}}>
          <div
            onClick={handlePhotoClick}
            onMouseEnter={()=>setAvatarHover(true)}
            onMouseLeave={()=>setAvatarHover(false)}
            title="Cambiar foto"
            style={{
              width:'80px',height:'80px',borderRadius:'20px',
              background:'linear-gradient(135deg,#1e293b,#0f172a)',
              border:`2px solid ${avatarHover?'rgba(0,112,243,.7)':'rgba(0,112,243,.3)'}`,
              display:'flex',alignItems:'center',justifyContent:'center',
              cursor:'pointer',overflow:'hidden',position:'relative',
              transition:'border-color .2s,transform .2s',
              transform:avatarHover?'scale(1.04)':'scale(1)',
              fontSize:'1.8rem',fontWeight:900,color:'#fff'
            }}>
            {uploadingPhoto
              ? <span style={{fontSize:'.55rem',color:'#666'}}>…</span>
              : photoUrl
                ? <img src={photoUrl} alt="Foto" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : initials()
            }
            {avatarHover && (
              <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.6)',
                display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'inherit'}}>
                <Icon name="camera" size={20} style={{color:'#fff'}}/>
              </div>
            )}
          </div>
          {/* Remove btn */}
          {data.profilePhoto && (
            <button onClick={handleDeletePhoto} title="Eliminar foto" style={{
              position:'absolute',bottom:'-6px',right:'-6px',
              width:'22px',height:'22px',borderRadius:'50%',
              background:'#ef4444',border:'none',color:'#fff',cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',padding:0
            }}><Icon name="trash" size={11}/></button>
          )}
        </div>
        <input type="file" ref={fileInputRef} onChange={handlePhotoChange}
          accept="image/jpeg,image/png,image/webp" style={{display:'none'}}/>

        {/* Info */}
        <div style={{flex:1}}>
          <h1 style={{margin:'0 0 .25rem',fontSize:'1.4rem',fontWeight:900,color:'#fff',
            textTransform:'uppercase',letterSpacing:'.5px'}}>
            {data.firstName} {data.lastName}
          </h1>
          <p style={{margin:'0 0 .6rem',fontSize:'.75rem',color:'#555',fontWeight:600}}>{data.email}</p>
          <span style={{
            display:'inline-flex',alignItems:'center',gap:'.35rem',
            background:'rgba(0,112,243,.12)',border:'1px solid rgba(0,112,243,.25)',
            color:'#0070F3',fontSize:'.58rem',fontWeight:900,
            letterSpacing:'2px',textTransform:'uppercase',
            padding:'.28rem .75rem',borderRadius:'99px'
          }}><Icon name="shield" size={9}/> Usuario Laika</span>
        </div>
      </div>

      {/* ─── FORM CARD ───────────────────────────────────────── */}
      <div style={{
        background:'rgba(255,255,255,.03)',
        border:'1px solid rgba(255,255,255,.07)',
        borderRadius:'20px', padding:'2rem',
        boxShadow:'0 4px 24px rgba(0,0,0,.3)'
      }}>
        <p style={{
          fontSize:'.6rem',fontWeight:900,textTransform:'uppercase',
          letterSpacing:'3px',color:'#3b82f6',margin:'0 0 1.5rem',
          paddingBottom:'1rem',borderBottom:'1px solid rgba(255,255,255,.06)'
        }}>Información Personal</p>

        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          {/* nombre / apellido */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <Field label="Nombre"   name="firstName" value={data.firstName} onChange={handleChange} placeholder="Tu nombre"/>
            <Field label="Apellido" name="lastName"  value={data.lastName}  onChange={handleChange} placeholder="Tu apellido"/>
          </div>
          <Field label="Email" type="email" name="email" value={data.email} onChange={handleChange} disabled helper="El email no se puede modificar"/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <Field label="Teléfono" type="tel" name="phone" value={data.phone} onChange={handleChange} placeholder="+52 000 000 0000"/>
            <Field label="Fecha de Nacimiento" type="date" name="birthDate" value={data.birthDate} onChange={handleChange}/>
          </div>
        </div>

        {/* actions */}
        <div style={{display:'flex',gap:'.75rem',alignItems:'center',flexWrap:'wrap',
          paddingTop:'1.25rem',borderTop:'1px solid rgba(255,255,255,.06)',marginTop:'1.25rem'}}>
          <button
            onClick={handleSave} disabled={saving}
            style={{
              background:saving?'rgba(255,255,255,.08)':'#fff',
              color:saving?'#555':'#000',border:'none',
              padding:'.7rem 2rem',fontSize:'.65rem',fontWeight:900,
              textTransform:'uppercase',letterSpacing:'2px',
              borderRadius:'99px',cursor:saving?'wait':'pointer',
              transition:'transform .2s,box-shadow .2s',
              boxShadow:'0 4px 16px rgba(255,255,255,.08)'
            }}
            onMouseOver={e=>{if(!saving){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(255,255,255,.14)';}}}
            onMouseOut={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 16px rgba(255,255,255,.08)';}}
          >{saving ? '⏳ Guardando…' : 'Guardar Cambios'}</button>

          <button style={{
            background:'rgba(255,255,255,.04)',color:'#666',
            border:'1px solid rgba(255,255,255,.08)',
            padding:'.7rem 1.5rem',fontSize:'.65rem',fontWeight:900,
            textTransform:'uppercase',letterSpacing:'2px',
            borderRadius:'99px',cursor:'pointer',transition:'all .2s'
          }}
            onMouseOver={e=>{e.currentTarget.style.color='#fff';e.currentTarget.style.borderColor='rgba(255,255,255,.2)';}}
            onMouseOut={e=>{e.currentTarget.style.color='#666';e.currentTarget.style.borderColor='rgba(255,255,255,.08)';}}
          >Cambiar Contraseña</button>

          {savedOk && (
            <span style={{display:'inline-flex',alignItems:'center',gap:'.4rem',
              color:'#22C55E',fontSize:'.65rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'1.5px'}}>
              <Icon name="check" size={13}/> ¡Guardado!
            </span>
          )}
        </div>
      </div>

      {/* ─── SECURITY CARD ───────────────────────────────────── */}
      <div style={{
        background:'rgba(239,68,68,.04)',
        border:'1px solid rgba(239,68,68,.12)',
        borderRadius:'20px',padding:'1.5rem',
        boxShadow:'0 4px 24px rgba(0,0,0,.25)'
      }}>
        <p style={{fontSize:'.6rem',fontWeight:900,textTransform:'uppercase',letterSpacing:'3px',color:'#ef4444',margin:'0 0 1rem'}}>
          ⚠ Zona de Seguridad
        </p>
        <p style={{fontSize:'.78rem',color:'#666',margin:'0 0 1rem'}}>
          Administra tu contraseña y configuraciones de seguridad de tu cuenta.
        </p>
        <button style={{
          background:'rgba(239,68,68,.1)',color:'#ef4444',
          border:'1px solid rgba(239,68,68,.25)',
          padding:'.6rem 1.25rem',fontSize:'.62rem',fontWeight:900,
          textTransform:'uppercase',letterSpacing:'1.5px',
          borderRadius:'99px',cursor:'pointer',transition:'all .2s'
        }}>Cambiar Contraseña</button>
      </div>

    </div>
  )
}

/* ── Input helper ───────────────────────────────────────────── */
function Field({ label, name, value, onChange, type='text', placeholder='', disabled=false, helper }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'.35rem'}}>
      <label style={{fontSize:'.58rem',fontWeight:900,textTransform:'uppercase',letterSpacing:'2px',color:'#444'}}>{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} disabled={disabled}
        style={{
          background: focused ? 'rgba(59,130,246,.07)' : 'rgba(255,255,255,.9)',
          border: `1px solid ${focused ? 'rgba(59,130,246,.5)' : 'rgba(0,0,0,.1)'}`,
          borderRadius:'11px',padding:'.65rem 1rem',color: disabled?'#555':'#000',
          fontSize:'.85rem',fontWeight:600,width:'100%',outline:'none',
          transition:'border-color .2s,background .2s',boxSizing:'border-box',
          cursor:disabled?'not-allowed':'text',opacity:disabled?.6:1
        }}
        onFocus={()=>setFocused(true)}
        onBlur={()=>setFocused(false)}
      />
      {helper && <span style={{fontSize:'.55rem',color:'#ef4444',fontWeight:700,letterSpacing:'1px',textTransform:'uppercase'}}>{helper}</span>}
    </div>
  )
}
