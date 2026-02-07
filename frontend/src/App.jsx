import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  // ─── Tab state ───
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('power')

  // ─── Theme ───
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // ─── Unit System ───
  const [unitSystem, setUnitSystem] = useState(() => localStorage.getItem('unitSystem') || 'metric')
  useEffect(() => { localStorage.setItem('unitSystem', unitSystem) }, [unitSystem])
  const isImperial = unitSystem === 'imperial'

  // ─── Unit Conversion Helpers ───
  const ftToM = (ft) => ft * 0.3048
  const mToFt = (m) => (m / 0.3048).toFixed(2)
  const inToMm = (inches) => inches * 25.4
  const mmToIn = (mm) => (mm / 25.4).toFixed(3)
  const fToC = (f) => (f - 32) * 5 / 9
  const cToF = (c) => (c * 9 / 5 + 32).toFixed(1)
  const sqmToSqft = (m2) => (m2 / 0.092903).toFixed(1)
  const lToGal = (l) => (l * 0.264172).toFixed(2)
  const closestAwg = (mm2) => {
    let closest = awgTable[0]
    for (const a of awgTable) { if (Math.abs(a.mm2 - mm2) < Math.abs(closest.mm2 - mm2)) closest = a }
    return closest.awg
  }

  // ═══════════════════════════════════════════════════════════════════
  // 1. POWER TAB STATE
  // ═══════════════════════════════════════════════════════════════════
  const [powerLoad, setPowerLoad] = useState('')
  const [phases, setPhases] = useState('3F_400V')
  const [cable, setCable] = useState('2.5')
  const [cableType, setCableType] = useState('Cu')
  const [cableLength, setCableLength] = useState('')
  const [mounting, setMounting] = useState('open')
  const [powerFactorPower, setPowerFactorPower] = useState('0.9')
  const [powerResults, setPowerResults] = useState(null)
  const [powerLoading, setPowerLoading] = useState(false)

  // ═══════════════════════════════════════════════════════════════════
  // 2. UPS TAB STATE
  // ═══════════════════════════════════════════════════════════════════
  const [itLoad, setItLoad] = useState('')
  const [runtimeMin, setRuntimeMin] = useState('')
  const [redundancyLevel, setRedundancyLevel] = useState('2N')
  const [powerFactor, setPowerFactor] = useState('0.9')
  const [growthMargin, setGrowthMargin] = useState('20')
  const [safetyMargin, setSafetyMargin] = useState('10')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  // ═══════════════════════════════════════════════════════════════════
  // 3. TRANSFORMER TAB STATE
  // ═══════════════════════════════════════════════════════════════════
  const [trafoLoads, setTrafoLoads] = useState([{ name: 'Load 1', kw: '', pf: '0.9', demand_factor: '1.0' }])
  const [trafoGrowth, setTrafoGrowth] = useState('20')
  const [trafoResults, setTrafoResults] = useState(null)
  const [trafoLoading, setTrafoLoading] = useState(false)

  // ═══════════════════════════════════════════════════════════════════
  // 4. GENERATOR TAB STATE
  // ═══════════════════════════════════════════════════════════════════
  const [genTotalLoad, setGenTotalLoad] = useState('')
  const [genMotorStarting, setGenMotorStarting] = useState('')
  const [genPf, setGenPf] = useState('0.8')
  const [genAltitude, setGenAltitude] = useState('0')
  const [genTemp, setGenTemp] = useState('40')
  const [genRedundancy, setGenRedundancy] = useState('N')
  const [genResults, setGenResults] = useState(null)
  const [genLoading, setGenLoading] = useState(false)

  // ═══════════════════════════════════════════════════════════════════
  // 5. POWER FACTOR CORRECTION TAB STATE
  // ═══════════════════════════════════════════════════════════════════
  const [pfcLoadKw, setPfcLoadKw] = useState('')
  const [pfcCurrentPf, setPfcCurrentPf] = useState('0.75')
  const [pfcTargetPf, setPfcTargetPf] = useState('0.95')
  const [pfcVoltage, setPfcVoltage] = useState('400')
  const [pfcResults, setPfcResults] = useState(null)
  const [pfcLoading, setPfcLoading] = useState(false)

  // ═══════════════════════════════════════════════════════════════════
  // 6. LIGHTING TAB STATE
  // ═══════════════════════════════════════════════════════════════════
  const [lightLength, setLightLength] = useState('')
  const [lightWidth, setLightWidth] = useState('')
  const [lightHeight, setLightHeight] = useState('3')
  const [lightWorkPlane, setLightWorkPlane] = useState('0.85')
  const [lightTargetLux, setLightTargetLux] = useState('500')
  const [lightLuminaireLm, setLightLuminaireLm] = useState('3600')
  const [lightLuminaireW, setLightLuminaireW] = useState('36')
  const [lightMf, setLightMf] = useState('0.8')
  const [lightReflectance, setLightReflectance] = useState('medium')
  const [lightResults, setLightResults] = useState(null)
  const [lightLoading, setLightLoading] = useState(false)

  // ═══════════════════════════════════════════════════════════════════
  // 7. GROUNDING TAB STATE
  // ═══════════════════════════════════════════════════════════════════
  const [gndSoilRes, setGndSoilRes] = useState('100')
  const [gndRodLength, setGndRodLength] = useState('3')
  const [gndRodDiameter, setGndRodDiameter] = useState('0.016')
  const [gndTargetR, setGndTargetR] = useState('10')
  const [gndNumRods, setGndNumRods] = useState('1')
  const [gndSpacing, setGndSpacing] = useState('3')
  const [gndResults, setGndResults] = useState(null)
  const [gndLoading, setGndLoading] = useState(false)

  // ═══════════════════════════════════════════════════════════════════
  // 8. ELECTRICITY COST TAB STATE
  // ═══════════════════════════════════════════════════════════════════
  const [costLoadKw, setCostLoadKw] = useState('')
  const [costHours, setCostHours] = useState('8')
  const [costDays, setCostDays] = useState('22')
  const [costPrice, setCostPrice] = useState('0.22')
  const [costDemand, setCostDemand] = useState('0')
  const [costPf, setCostPf] = useState('0.9')
  const [costEfficiency, setCostEfficiency] = useState('100')
  const [costResults, setCostResults] = useState(null)
  const [costLoading, setCostLoading] = useState(false)

  // ═══════════════════════════════════════════════════════════════════
  // 9. MOTOR STARTING TAB STATE
  // ═══════════════════════════════════════════════════════════════════
  const [motorKw, setMotorKw] = useState('')
  const [motorVoltage, setMotorVoltage] = useState('400')
  const [motorEfficiency, setMotorEfficiency] = useState('90')
  const [motorPf, setMotorPf] = useState('0.85')
  const [motorStarting, setMotorStarting] = useState('DOL')
  const [motorPoles, setMotorPoles] = useState('4')
  const [motorResults, setMotorResults] = useState(null)
  const [motorLoading, setMotorLoading] = useState(false)

  // ═══════════════════════════════════════════════════════════════════
  // 10. IMPERIAL CONVERTER STATE
  // ═══════════════════════════════════════════════════════════════════
  const [impAwgVal, setImpAwgVal] = useState('')
  const [impMm2Val, setImpMm2Val] = useState('')
  const [impFeetVal, setImpFeetVal] = useState('')
  const [impCmVal, setImpCmVal] = useState('')
  const [impInchVal, setImpInchVal] = useState('')
  const [impMmVal, setImpMmVal] = useState('')
  const [impSqftVal, setImpSqftVal] = useState('')
  const [impSqmVal, setImpSqmVal] = useState('')
  const [impLbVal, setImpLbVal] = useState('')
  const [impKgVal, setImpKgVal] = useState('')
  const [impOzVal, setImpOzVal] = useState('')
  const [impGVal, setImpGVal] = useState('')
  const [impMileVal, setImpMileVal] = useState('')
  const [impKmVal, setImpKmVal] = useState('')
  const [impFVal, setImpFVal] = useState('')
  const [impCVal, setImpCVal] = useState('')

  // AWG to mm² lookup table
  const awgTable = [
    { awg: '0000 (4/0)', mm2: 107.2 }, { awg: '000 (3/0)', mm2: 85.0 },
    { awg: '00 (2/0)', mm2: 67.4 }, { awg: '0 (1/0)', mm2: 53.5 },
    { awg: '1', mm2: 42.4 }, { awg: '2', mm2: 33.6 }, { awg: '3', mm2: 26.7 },
    { awg: '4', mm2: 21.2 }, { awg: '5', mm2: 16.8 }, { awg: '6', mm2: 13.3 },
    { awg: '7', mm2: 10.5 }, { awg: '8', mm2: 8.37 }, { awg: '9', mm2: 6.63 },
    { awg: '10', mm2: 5.26 }, { awg: '11', mm2: 4.17 }, { awg: '12', mm2: 3.31 },
    { awg: '13', mm2: 2.62 }, { awg: '14', mm2: 2.08 }, { awg: '15', mm2: 1.65 },
    { awg: '16', mm2: 1.31 }, { awg: '17', mm2: 1.04 }, { awg: '18', mm2: 0.823 },
    { awg: '19', mm2: 0.653 }, { awg: '20', mm2: 0.518 }, { awg: '22', mm2: 0.326 },
    { awg: '24', mm2: 0.205 }, { awg: '26', mm2: 0.129 },
  ]

  // Conversion helpers
  const convAwgToMm2 = (awg) => { const f = awgTable.find(a => a.awg === awg); return f ? f.mm2.toString() : '' }
  const convMm2ToAwg = (mm2) => {
    const v = parseFloat(mm2); if (isNaN(v)) return ''
    let closest = awgTable[0]
    for (const a of awgTable) { if (Math.abs(a.mm2 - v) < Math.abs(closest.mm2 - v)) closest = a }
    return `${closest.awg} (${closest.mm2} mm²)`
  }

  // ═══════════════════════════════════════════════════════════════════
  // AUTO-UPDATE EFFECTS
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (results && itLoad && runtimeMin) {
      const t = setTimeout(() => handleUPSCalc(null), 300)
      return () => clearTimeout(t)
    }
  }, [itLoad, runtimeMin, redundancyLevel, powerFactor, growthMargin, safetyMargin])

  useEffect(() => {
    if (powerResults && powerLoad && cableLength) {
      const t = setTimeout(() => handlePowerCalc(null), 300)
      return () => clearTimeout(t)
    }
  }, [powerLoad, phases, cable, cableType, cableLength, mounting, powerFactorPower])

  // ═══════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════

  // 1. Power
  const handlePowerCalc = async (e) => {
    if (e) e.preventDefault()
    setPowerLoading(true)
    try {
      const lengthM = isImperial ? ftToM(parseFloat(cableLength)) : parseFloat(cableLength)
      const r = await axios.post(`${API_URL}/calculate-power`, {
        load_kw: parseFloat(powerLoad), phases, cable_mm2: parseFloat(cable),
        cable_type: cableType, length_m: lengthM,
        mounting, power_factor: parseFloat(powerFactorPower)
      })
      setPowerResults(r.data)
    } catch (err) {
      setPowerResults({ status: 'error', detail: err.message })
    } finally { setPowerLoading(false) }
  }

  // 2. UPS
  const handleUPSCalc = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    try {
      const r = await axios.post(`${API_URL}/calculate`, {
        it_load_kw: parseFloat(itLoad), runtime_min: parseInt(runtimeMin),
        redundancy_level: redundancyLevel, power_factor: parseFloat(powerFactor),
        growth_margin: parseInt(growthMargin), safety_margin: parseInt(safetyMargin)
      })
      setResults(r.data)
    } catch (err) {
      setResults({ status: 'error', detail: err.message })
    } finally { setLoading(false) }
  }

  const handleGeneratePDF = async () => {
    try {
      await axios.post(`${API_URL}/generate-pdf`, {
        it_load_kw: parseFloat(itLoad), runtime_min: parseInt(runtimeMin),
        redundancy_level: redundancyLevel, power_factor: parseFloat(powerFactor),
        growth_margin: parseInt(growthMargin), safety_margin: parseInt(safetyMargin)
      })
      alert('PDF generated successfully!')
    } catch { alert('Failed to generate PDF') }
  }

  // 3. Transformer
  const handleTrafoCalc = async (e) => {
    if (e) e.preventDefault()
    setTrafoLoading(true)
    try {
      const r = await axios.post(`${API_URL}/calculate-transformer`, {
        loads: trafoLoads.map(l => ({ name: l.name, kw: parseFloat(l.kw) || 0, pf: parseFloat(l.pf), demand_factor: parseFloat(l.demand_factor) })),
        growth_pct: parseFloat(trafoGrowth)
      })
      setTrafoResults(r.data)
    } catch (err) {
      setTrafoResults({ status: 'error', detail: err.message })
    } finally { setTrafoLoading(false) }
  }
  const addTrafoLoad = () => setTrafoLoads([...trafoLoads, { name: `Load ${trafoLoads.length + 1}`, kw: '', pf: '0.9', demand_factor: '1.0' }])
  const removeTrafoLoad = (i) => setTrafoLoads(trafoLoads.filter((_, idx) => idx !== i))
  const updateTrafoLoad = (i, field, val) => { const n = [...trafoLoads]; n[i][field] = val; setTrafoLoads(n) }

  // 4. Generator
  const handleGenCalc = async (e) => {
    if (e) e.preventDefault()
    setGenLoading(true)
    try {
      const altM = isImperial ? ftToM(parseFloat(genAltitude)) : parseFloat(genAltitude)
      const tempC = isImperial ? fToC(parseFloat(genTemp)) : parseFloat(genTemp)
      const r = await axios.post(`${API_URL}/calculate-generator`, {
        total_load_kw: parseFloat(genTotalLoad), motor_starting_kw: parseFloat(genMotorStarting) || 0,
        power_factor: parseFloat(genPf), altitude_m: altM,
        temperature_c: tempC, redundancy: genRedundancy
      })
      setGenResults(r.data)
    } catch (err) {
      setGenResults({ status: 'error', detail: err.message })
    } finally { setGenLoading(false) }
  }

  // 5. PFC
  const handlePfcCalc = async (e) => {
    if (e) e.preventDefault()
    setPfcLoading(true)
    try {
      const r = await axios.post(`${API_URL}/calculate-pfc`, {
        load_kw: parseFloat(pfcLoadKw), current_pf: parseFloat(pfcCurrentPf),
        target_pf: parseFloat(pfcTargetPf), voltage: parseFloat(pfcVoltage)
      })
      setPfcResults(r.data)
    } catch (err) {
      setPfcResults({ status: 'error', detail: err.message })
    } finally { setPfcLoading(false) }
  }

  // 6. Lighting
  const handleLightCalc = async (e) => {
    if (e) e.preventDefault()
    setLightLoading(true)
    try {
      const c = isImperial ? (v) => ftToM(v) : (v) => v
      const r = await axios.post(`${API_URL}/calculate-lighting`, {
        room_length: c(parseFloat(lightLength)), room_width: c(parseFloat(lightWidth)),
        room_height: c(parseFloat(lightHeight)), work_plane: c(parseFloat(lightWorkPlane)),
        target_lux: parseFloat(lightTargetLux), luminaire_lm: parseFloat(lightLuminaireLm),
        luminaire_w: parseFloat(lightLuminaireW), maintenance_factor: parseFloat(lightMf),
        room_reflectance: lightReflectance
      })
      setLightResults(r.data)
    } catch (err) {
      setLightResults({ status: 'error', detail: err.message })
    } finally { setLightLoading(false) }
  }

  // 7. Grounding
  const handleGndCalc = async (e) => {
    if (e) e.preventDefault()
    setGndLoading(true)
    try {
      const spacingM = isImperial ? ftToM(parseFloat(gndSpacing)) : parseFloat(gndSpacing)
      const r = await axios.post(`${API_URL}/calculate-grounding`, {
        soil_resistivity: parseFloat(gndSoilRes), rod_length: parseFloat(gndRodLength),
        rod_diameter: parseFloat(gndRodDiameter), target_resistance: parseFloat(gndTargetR),
        num_rods: parseInt(gndNumRods), rod_spacing: spacingM
      })
      setGndResults(r.data)
    } catch (err) {
      setGndResults({ status: 'error', detail: err.message })
    } finally { setGndLoading(false) }
  }

  // 8. Cost
  const handleCostCalc = async (e) => {
    if (e) e.preventDefault()
    setCostLoading(true)
    try {
      const r = await axios.post(`${API_URL}/calculate-cost`, {
        load_kw: parseFloat(costLoadKw), hours_per_day: parseFloat(costHours),
        days_per_month: parseFloat(costDays), price_kwh: parseFloat(costPrice),
        demand_charge: parseFloat(costDemand), power_factor: parseFloat(costPf),
        efficiency: parseFloat(costEfficiency)
      })
      setCostResults(r.data)
    } catch (err) {
      setCostResults({ status: 'error', detail: err.message })
    } finally { setCostLoading(false) }
  }

  // 9. Motor
  const handleMotorCalc = async (e) => {
    if (e) e.preventDefault()
    setMotorLoading(true)
    try {
      const r = await axios.post(`${API_URL}/calculate-motor`, {
        motor_kw: parseFloat(motorKw), voltage: parseFloat(motorVoltage),
        efficiency: parseFloat(motorEfficiency), power_factor: parseFloat(motorPf),
        starting_method: motorStarting, poles: parseInt(motorPoles)
      })
      setMotorResults(r.data)
    } catch (err) {
      setMotorResults({ status: 'error', detail: err.message })
    } finally { setMotorLoading(false) }
  }

  // ═══════════════════════════════════════════════════════════════════
  // TAB CONFIG
  // ═══════════════════════════════════════════════════════════════════
  const tabs = [
    { id: 'power', label: '⚡ Power' },
    { id: 'ups', label: '🔋 UPS' },
    { id: 'transformer', label: '🔌 Transformer' },
    { id: 'generator', label: '⛽ Generator' },
    { id: 'pfc', label: '📐 PFC' },
    { id: 'lighting', label: '💡 Lighting' },
    { id: 'grounding', label: '🔩 Grounding' },
    { id: 'cost', label: '💰 Cost' },
    { id: 'motor', label: '⚙️ Motor' },
    { id: 'imperial', label: '🔄 Imperial' },
    { id: 'settings', label: '🛠️ Settings' },
  ]

  // ═══════════════════════════════════════════════════════════════════
  // ERROR DISPLAY HELPER
  // ═══════════════════════════════════════════════════════════════════
  const ErrorBlock = ({ detail }) => (
    <div className="error-container">
      <span className="error-icon">❌</span>
      <p className="error-message">Error: {detail}</p>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="app">
      {/* ─── Navbar ─── */}
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => setActiveTab('power')} style={{ cursor: 'pointer' }}>
          <span className="brand-icon">⚡</span>
          <span className="brand-text">Electrical</span>
        </div>

        <div className="navbar-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`nav-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="navbar-actions">
          <button className="unit-toggle-btn" onClick={() => setUnitSystem(isImperial ? 'metric' : 'imperial')} title={isImperial ? 'Switch to Metric' : 'Switch to Imperial'}>
            {isImperial ? '🇺🇸 IMP' : '🇪🇺 SI'}
          </button>
          <button className="burger-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span className="burger-line"></span>
            <span className="burger-line"></span>
            <span className="burger-line"></span>
          </button>
          {menuOpen && (
            <div className="dropdown-menu">
              {tabs.map(t => (
                <button key={t.id} className={`dropdown-item ${activeTab === t.id ? 'dropdown-item-active' : ''}`} onClick={() => { setActiveTab(t.id); setMenuOpen(false) }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>}

      <div className="container">

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 1. POWER TAB                                              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'power' && (
          <>
            <header className="header"><h1>Power calculator</h1></header>
            <div className="card">
              <form onSubmit={handlePowerCalc}>
                <div className="form-group">
                  <label><span className="label-icon">🔌</span>Load (kW)</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.1" value={powerLoad} onChange={e => setPowerLoad(e.target.value)} placeholder="e.g. 10" required />
                  </div>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">⚡</span>Phases</label>
                  <select value={phases} onChange={e => setPhases(e.target.value)}>
                    <option value="1F_230V">1F 230V</option>
                    <option value="3F_400V">3F 400V</option>
                  </select>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">⚡</span>Power Factor</label>
                  <select value={powerFactorPower} onChange={e => setPowerFactorPower(e.target.value)}>
                    <option value="0.7">0.7</option><option value="0.8">0.8</option>
                    <option value="0.9">0.9</option><option value="1">1.0</option>
                  </select>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">🔗</span>Cable Type</label>
                  <select value={cableType} onChange={e => setCableType(e.target.value)}>
                    <option value="Cu">Copper (Cu)</option><option value="Al">Aluminum (Al)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">🔗</span>Cable ({isImperial ? 'AWG ≈ mm²' : 'mm²'})</label>
                  <select value={cable} onChange={e => setCable(e.target.value)}>
                    {[1.5,2.5,4,6,10,16,25,35,50,70,95,120,150,185,240].map(s => (
                      <option key={s} value={s}>{isImperial ? `AWG ${closestAwg(s)} (${s} mm²)` : `${s} mm²`}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">📏</span>Length ({isImperial ? 'ft' : 'm'})</label>
                  <div className="input-wrapper">
                    <input type="number" step="1" value={cableLength} onChange={e => setCableLength(e.target.value)} placeholder="e.g. 50" required />
                  </div>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">📦</span>Mounting</label>
                  <select value={mounting} onChange={e => setMounting(e.target.value)}>
                    <option value="open">Open</option><option value="conduit">In conduit</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={powerLoading}>
                  {powerLoading ? <><span className="spinner"></span>Calculating...</> : 'Calculate'}
                </button>
              </form>
            </div>
            {powerResults && (
              <div className="card results">
                {powerResults.status === 'success' ? (
                  <>
                    <div className="result-row-compact">
                      <div className="result-compact">
                        <span className="result-compact-label">Current</span>
                        <span className="result-compact-value">{powerResults.results.current_a}<span className="unit">A</span></span>
                      </div>
                      <div className="result-compact" style={powerResults.results.cable_max_a < powerResults.results.circuit_breaker_a ? {backgroundColor:'rgba(239,68,68,0.2)',borderColor:'rgba(239,68,68,0.5)'} : {}}>
                        <span className="result-compact-label">Cable</span>
                        <span className="result-compact-value" style={powerResults.results.cable_max_a < powerResults.results.circuit_breaker_a ? {color:'#ef4444'} : {}}>{powerResults.results.cable_max_a}<span className="unit">A</span></span>
                      </div>
                      <div className="result-compact">
                        <span className="result-compact-label">Breaker</span>
                        <span className="result-compact-value">{powerResults.results.circuit_breaker_a}<span className="unit">A</span></span>
                      </div>
                    </div>
                    <div className="result-row-compact" style={{marginTop:'0.5rem'}}>
                      <div className="result-compact" style={parseFloat(powerResults.results.voltage_drop_pct) >= 4.01 ? {backgroundColor:'rgba(239,68,68,0.2)',borderColor:'rgba(239,68,68,0.5)'} : {}}>
                        <span className="result-compact-label">Voltage Drop</span>
                        <span className="result-compact-value" style={parseFloat(powerResults.results.voltage_drop_pct) >= 4.01 ? {color:'#ef4444'} : {}}>{powerResults.results.voltage_drop_pct}<span className="unit">%</span></span>
                      </div>
                      <div className="result-compact">
                        <span className="result-compact-label">Short Circuit</span>
                        <span className="result-compact-value">{powerResults.results.short_circuit_ka}<span className="unit">kA</span></span>
                      </div>
                    </div>
                  </>
                ) : <ErrorBlock detail={powerResults.detail} />}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 2. UPS TAB                                                 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'ups' && (
          <>
            <header className="header"><h1>UPS calculator</h1></header>
            <div className="card">
              <form onSubmit={handleUPSCalc}>
                <div className="form-group">
                  <label><span className="label-icon">🔌</span>IT Load (kW)</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.1" value={itLoad} onChange={e => setItLoad(e.target.value)} placeholder="e.g. 100" required />
                  </div>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">⏱️</span>Runtime (min.)</label>
                  <select value={runtimeMin} onChange={e => setRuntimeMin(e.target.value)} required>
                    <option value="">Select...</option>
                    {[5,10,15,20,25,30,35,40,45,50,55,60].map(m => <option key={m} value={m}>{m} min.</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">🛡️</span>Redundancy Level</label>
                  <select value={redundancyLevel} onChange={e => setRedundancyLevel(e.target.value)}>
                    <option value="N">N (No Redundancy)</option>
                    <option value="N+1">N+1 (Parallel Redundant)</option>
                    <option value="2N">2N (Dual Path)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">⚡</span>Power Factor</label>
                  <select value={powerFactor} onChange={e => setPowerFactor(e.target.value)}>
                    <option value="0.7">0.7</option><option value="0.8">0.8</option>
                    <option value="0.9">0.9</option><option value="1">1.0</option>
                  </select>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">📈</span>Growth Margin</label>
                  <select value={growthMargin} onChange={e => setGrowthMargin(e.target.value)}>
                    <option value="10">10%</option><option value="20">20%</option>
                    <option value="30">30%</option><option value="40">40%</option>
                  </select>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">🔒</span>Safety Margin</label>
                  <select value={safetyMargin} onChange={e => setSafetyMargin(e.target.value)}>
                    <option value="10">10%</option><option value="20">20%</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><span className="spinner"></span>Calculating...</> : 'Calculate'}
                </button>
              </form>
            </div>
            {results && (
              <div className="card results" style={{padding:'1rem'}}>
                {results.status === 'success' ? (
                  <>
                    <div className="result-row-compact">
                      <div className="result-compact"><span className="result-compact-label">UPS</span><span className="result-compact-value">{results.results.ups_unit_min_kw}<span className="unit">kW</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">UPS</span><span className="result-compact-value">{results.results.ups_unit_min_kva}<span className="unit">kVA</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Battery</span><span className="result-compact-value">{results.results.total_battery_ah}<span className="unit">Ah</span></span></div>
                    </div>
                    <div className="result-row-compact" style={{marginTop:'0.5rem'}}>
                      <div className="result-compact"><span className="result-compact-label">Heat</span><span className="result-compact-value">{results.results.heat_dissipation_btu.toLocaleString()}<span className="unit">BTU</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">PF</span><span className="result-compact-value">{results.results.power_factor}</span></div>
                      <div className="result-compact"><span className="result-compact-label">Growth</span><span className="result-compact-value">+{results.results.growth_margin_pct}<span className="unit">%</span></span></div>
                    </div>
                    <button onClick={handleGeneratePDF} className="btn btn-success" style={{marginTop:'0.75rem',padding:'0.5rem 1rem',fontSize:'0.875rem'}}>
                      📄 Generate PDF
                    </button>
                  </>
                ) : <ErrorBlock detail={results.detail} />}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 3. TRANSFORMER TAB                                         */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'transformer' && (
          <>
            <header className="header"><h1>Transformer sizing</h1></header>
            <div className="card">
              <form onSubmit={handleTrafoCalc}>
                {trafoLoads.map((load, i) => (
                  <div key={i} className="load-group">
                    <div className="load-group-header">
                      <span className="load-group-title">{load.name}</span>
                      {trafoLoads.length > 1 && (
                        <button type="button" className="btn-remove" onClick={() => removeTrafoLoad(i)}>✕</button>
                      )}
                    </div>
                    <div className="form-group">
                      <label><span className="label-icon">🔌</span>Load (kW)</label>
                      <div className="input-wrapper">
                        <input type="number" step="0.1" value={load.kw} onChange={e => updateTrafoLoad(i, 'kw', e.target.value)} placeholder="kW" required />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>PF</label>
                        <select value={load.pf} onChange={e => updateTrafoLoad(i, 'pf', e.target.value)}>
                          <option value="0.7">0.7</option><option value="0.8">0.8</option>
                          <option value="0.85">0.85</option><option value="0.9">0.9</option>
                          <option value="0.95">0.95</option><option value="1">1.0</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Demand Factor</label>
                        <select value={load.demand_factor} onChange={e => updateTrafoLoad(i, 'demand_factor', e.target.value)}>
                          <option value="0.5">0.5</option><option value="0.6">0.6</option>
                          <option value="0.7">0.7</option><option value="0.8">0.8</option>
                          <option value="0.9">0.9</option><option value="1.0">1.0</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary" onClick={addTrafoLoad} style={{marginBottom:'1rem'}}>
                  + Add Load
                </button>
                <div className="form-group">
                  <label><span className="label-icon">📈</span>Growth Margin</label>
                  <select value={trafoGrowth} onChange={e => setTrafoGrowth(e.target.value)}>
                    <option value="10">10%</option><option value="20">20%</option>
                    <option value="30">30%</option><option value="40">40%</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={trafoLoading}>
                  {trafoLoading ? <><span className="spinner"></span>Calculating...</> : 'Calculate'}
                </button>
              </form>
            </div>
            {trafoResults && (
              <div className="card results">
                {trafoResults.status === 'success' ? (
                  <>
                    <div className="result-row-compact">
                      <div className="result-compact"><span className="result-compact-label">Demand</span><span className="result-compact-value">{trafoResults.results.total_demand_kw}<span className="unit">kW</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Apparent</span><span className="result-compact-value">{trafoResults.results.total_demand_kva}<span className="unit">kVA</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Design</span><span className="result-compact-value">{trafoResults.results.design_kva}<span className="unit">kVA</span></span></div>
                    </div>
                    <div className="result-row-compact" style={{marginTop:'0.5rem'}}>
                      <div className="result-compact result-highlight"><span className="result-compact-label">Selected</span><span className="result-compact-value">{trafoResults.results.selected_kva}<span className="unit">kVA</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Loading</span><span className="result-compact-value">{trafoResults.results.loading_pct}<span className="unit">%</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Losses</span><span className="result-compact-value">{trafoResults.results.total_losses_w}<span className="unit">W</span></span></div>
                    </div>
                  </>
                ) : <ErrorBlock detail={trafoResults.detail} />}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 4. GENERATOR TAB                                           */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'generator' && (
          <>
            <header className="header"><h1>Generator sizing</h1></header>
            <div className="card">
              <form onSubmit={handleGenCalc}>
                <div className="form-group">
                  <label><span className="label-icon">🔌</span>Total Load (kW)</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.1" value={genTotalLoad} onChange={e => setGenTotalLoad(e.target.value)} placeholder="e.g. 200" required />
                  </div>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">⚙️</span>Motor Starting (kW)</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.1" value={genMotorStarting} onChange={e => setGenMotorStarting(e.target.value)} placeholder="e.g. 30" />
                  </div>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">⚡</span>Power Factor</label>
                  <select value={genPf} onChange={e => setGenPf(e.target.value)}>
                    <option value="0.7">0.7</option><option value="0.8">0.8</option>
                    <option value="0.85">0.85</option><option value="0.9">0.9</option>
                  </select>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">🏔️</span>Altitude ({isImperial ? 'ft' : 'm'})</label>
                  <div className="input-wrapper">
                    <input type="number" step="100" value={genAltitude} onChange={e => setGenAltitude(e.target.value)} placeholder={isImperial ? 'e.g. 0' : 'e.g. 0'} />
                  </div>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">🌡️</span>Temperature ({isImperial ? '°F' : '°C'})</label>
                  <div className="input-wrapper">
                    <input type="number" step="1" value={genTemp} onChange={e => setGenTemp(e.target.value)} placeholder="e.g. 40" />
                  </div>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">🛡️</span>Redundancy</label>
                  <select value={genRedundancy} onChange={e => setGenRedundancy(e.target.value)}>
                    <option value="N">N (Single unit)</option>
                    <option value="N+1">N+1 (Redundant)</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={genLoading}>
                  {genLoading ? <><span className="spinner"></span>Calculating...</> : 'Calculate'}
                </button>
              </form>
            </div>
            {genResults && (
              <div className="card results">
                {genResults.status === 'success' ? (
                  <>
                    <div className="result-row-compact">
                      <div className="result-compact"><span className="result-compact-label">Continuous</span><span className="result-compact-value">{genResults.results.continuous_kva}<span className="unit">kVA</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Peak</span><span className="result-compact-value">{genResults.results.peak_kva}<span className="unit">kVA</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Required</span><span className="result-compact-value">{genResults.results.required_kva}<span className="unit">kVA</span></span></div>
                    </div>
                    <div className="result-row-compact" style={{marginTop:'0.5rem'}}>
                      <div className="result-compact result-highlight"><span className="result-compact-label">Selected</span><span className="result-compact-value">{genResults.results.selected_kva}<span className="unit">kVA</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Units</span><span className="result-compact-value">{genResults.results.total_units}<span className="unit">×</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Fuel</span><span className="result-compact-value">{isImperial ? lToGal(genResults.results.fuel_lph) : genResults.results.fuel_lph}<span className="unit">{isImperial ? 'gal/h' : 'L/h'}</span></span></div>
                    </div>
                    <div className="result-row-compact" style={{marginTop:'0.5rem'}}>
                      <div className="result-compact"><span className="result-compact-label">Derating</span><span className="result-compact-value">{genResults.results.derating_factor}</span></div>
                      <div className="result-compact"><span className="result-compact-label">Loading</span><span className="result-compact-value">{genResults.results.loading_pct}<span className="unit">%</span></span></div>
                    </div>
                  </>
                ) : <ErrorBlock detail={genResults.detail} />}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 5. PFC TAB                                                 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'pfc' && (
          <>
            <header className="header"><h1>Power Factor Correction</h1></header>
            <div className="card">
              <form onSubmit={handlePfcCalc}>
                <div className="form-group">
                  <label><span className="label-icon">🔌</span>Active Power (kW)</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.1" value={pfcLoadKw} onChange={e => setPfcLoadKw(e.target.value)} placeholder="e.g. 150" required />
                  </div>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">📉</span>Current cos φ</label>
                  <select value={pfcCurrentPf} onChange={e => setPfcCurrentPf(e.target.value)}>
                    <option value="0.5">0.50</option><option value="0.55">0.55</option>
                    <option value="0.6">0.60</option><option value="0.65">0.65</option>
                    <option value="0.7">0.70</option><option value="0.75">0.75</option>
                    <option value="0.8">0.80</option><option value="0.85">0.85</option>
                    <option value="0.9">0.90</option>
                  </select>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">📈</span>Target cos φ</label>
                  <select value={pfcTargetPf} onChange={e => setPfcTargetPf(e.target.value)}>
                    <option value="0.9">0.90</option><option value="0.92">0.92</option>
                    <option value="0.95">0.95</option><option value="0.98">0.98</option>
                    <option value="1">1.00</option>
                  </select>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">⚡</span>Voltage (V)</label>
                  <select value={pfcVoltage} onChange={e => setPfcVoltage(e.target.value)}>
                    <option value="230">230V</option><option value="400">400V</option>
                    <option value="690">690V</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={pfcLoading}>
                  {pfcLoading ? <><span className="spinner"></span>Calculating...</> : 'Calculate'}
                </button>
              </form>
            </div>
            {pfcResults && (
              <div className="card results">
                {pfcResults.status === 'success' ? (
                  <>
                    <div className="result-row-compact">
                      <div className="result-compact"><span className="result-compact-label">Q before</span><span className="result-compact-value">{pfcResults.results.q_before_kvar}<span className="unit">kVAr</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Q after</span><span className="result-compact-value">{pfcResults.results.q_after_kvar}<span className="unit">kVAr</span></span></div>
                      <div className="result-compact result-highlight"><span className="result-compact-label">Required</span><span className="result-compact-value">{pfcResults.results.q_required_kvar}<span className="unit">kVAr</span></span></div>
                    </div>
                    <div className="result-row-compact" style={{marginTop:'0.5rem'}}>
                      <div className="result-compact result-highlight"><span className="result-compact-label">Selected</span><span className="result-compact-value">{pfcResults.results.selected_kvar}<span className="unit">kVAr</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">I before</span><span className="result-compact-value">{pfcResults.results.current_before_a}<span className="unit">A</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">I after</span><span className="result-compact-value">{pfcResults.results.current_after_a}<span className="unit">A</span></span></div>
                    </div>
                    <div className="result-row-compact" style={{marginTop:'0.5rem'}}>
                      <div className="result-compact"><span className="result-compact-label">I reduction</span><span className="result-compact-value">{pfcResults.results.current_reduction_pct}<span className="unit">%</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Savings</span><span className="result-compact-value">~{pfcResults.results.annual_savings_eur}<span className="unit">€/yr</span></span></div>
                    </div>
                  </>
                ) : <ErrorBlock detail={pfcResults.detail} />}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 6. LIGHTING TAB                                            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'lighting' && (
          <>
            <header className="header"><h1>Lighting calculator</h1></header>
            <div className="card">
              <form onSubmit={handleLightCalc}>
                <div className="form-row">
                  <div className="form-group">
                    <label><span className="label-icon">📏</span>Length ({isImperial ? 'ft' : 'm'})</label>
                    <div className="input-wrapper">
                      <input type="number" step="0.1" value={lightLength} onChange={e => setLightLength(e.target.value)} placeholder={isImperial ? 'e.g. 40' : 'e.g. 12'} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label><span className="label-icon">📏</span>Width ({isImperial ? 'ft' : 'm'})</label>
                    <div className="input-wrapper">
                      <input type="number" step="0.1" value={lightWidth} onChange={e => setLightWidth(e.target.value)} placeholder={isImperial ? 'e.g. 26' : 'e.g. 8'} required />
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Height ({isImperial ? 'ft' : 'm'})</label>
                    <div className="input-wrapper">
                      <input type="number" step="0.1" value={lightHeight} onChange={e => setLightHeight(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Work plane ({isImperial ? 'ft' : 'm'})</label>
                    <div className="input-wrapper">
                      <input type="number" step="0.05" value={lightWorkPlane} onChange={e => setLightWorkPlane(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">💡</span>Target illuminance (lux)</label>
                  <select value={lightTargetLux} onChange={e => setLightTargetLux(e.target.value)}>
                    <option value="100">100 lx (Corridors)</option>
                    <option value="150">150 lx (Stairs)</option>
                    <option value="200">200 lx (Storage)</option>
                    <option value="300">300 lx (Reception)</option>
                    <option value="500">500 lx (Office)</option>
                    <option value="750">750 lx (Technical)</option>
                    <option value="1000">1000 lx (Precision)</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Luminaire (lm)</label>
                    <div className="input-wrapper">
                      <input type="number" step="100" value={lightLuminaireLm} onChange={e => setLightLuminaireLm(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Luminaire (W)</label>
                    <div className="input-wrapper">
                      <input type="number" step="1" value={lightLuminaireW} onChange={e => setLightLuminaireW(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Maintenance factor</label>
                    <select value={lightMf} onChange={e => setLightMf(e.target.value)}>
                      <option value="0.6">0.6 (Dirty)</option>
                      <option value="0.7">0.7 (Normal)</option>
                      <option value="0.8">0.8 (Clean)</option>
                      <option value="0.9">0.9 (Very clean)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Reflectance</label>
                    <select value={lightReflectance} onChange={e => setLightReflectance(e.target.value)}>
                      <option value="low">Low (dark)</option>
                      <option value="medium">Medium</option>
                      <option value="high">High (white)</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={lightLoading}>
                  {lightLoading ? <><span className="spinner"></span>Calculating...</> : 'Calculate'}
                </button>
              </form>
            </div>
            {lightResults && (
              <div className="card results">
                {lightResults.status === 'success' ? (
                  <>
                    <div className="result-row-compact">
                      <div className="result-compact result-highlight"><span className="result-compact-label">Luminaires</span><span className="result-compact-value">{lightResults.results.num_luminaires}<span className="unit">pcs</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Actual</span><span className="result-compact-value">{lightResults.results.actual_lux}<span className="unit">lx</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Area</span><span className="result-compact-value">{isImperial ? sqmToSqft(lightResults.results.area_m2) : lightResults.results.area_m2}<span className="unit">{isImperial ? 'ft²' : 'm²'}</span></span></div>
                    </div>
                    <div className="result-row-compact" style={{marginTop:'0.5rem'}}>
                      <div className="result-compact"><span className="result-compact-label">Layout</span><span className="result-compact-value">{lightResults.results.layout_rows}×{lightResults.results.layout_cols}</span></div>
                      <div className="result-compact"><span className="result-compact-label">Power</span><span className="result-compact-value">{lightResults.results.total_power_w}<span className="unit">W</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Density</span><span className="result-compact-value">{isImperial ? (lightResults.results.power_density_wm2 * 0.092903).toFixed(2) : lightResults.results.power_density_wm2}<span className="unit">{isImperial ? 'W/ft²' : 'W/m²'}</span></span></div>
                    </div>
                    <div className="result-row-compact" style={{marginTop:'0.5rem'}}>
                      <div className="result-compact"><span className="result-compact-label">Room Index</span><span className="result-compact-value">{lightResults.results.room_index}</span></div>
                      <div className="result-compact"><span className="result-compact-label">UF</span><span className="result-compact-value">{lightResults.results.utilization_factor}</span></div>
                    </div>
                  </>
                ) : <ErrorBlock detail={lightResults.detail} />}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 7. GROUNDING TAB                                           */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'grounding' && (
          <>
            <header className="header"><h1>Grounding resistance</h1></header>
            <div className="card">
              <form onSubmit={handleGndCalc}>
                <div className="form-group">
                  <label><span className="label-icon">🌍</span>Soil resistivity (Ω·m)</label>
                  <select value={gndSoilRes} onChange={e => setGndSoilRes(e.target.value)}>
                    <option value="20">20 (Wet clay)</option>
                    <option value="50">50 (Clay)</option>
                    <option value="100">100 (Loam)</option>
                    <option value="200">200 (Sand)</option>
                    <option value="500">500 (Gravel)</option>
                    <option value="1000">1000 (Rock)</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Rod length {isImperial ? '(ft)' : '(m)'}</label>
                    <select value={gndRodLength} onChange={e => setGndRodLength(e.target.value)}>
                      <option value="1.5">{isImperial ? '5 ft' : '1.5 m'}</option><option value="2">{isImperial ? '6.5 ft' : '2 m'}</option>
                      <option value="3">{isImperial ? '10 ft' : '3 m'}</option><option value="4.5">{isImperial ? '15 ft' : '4.5 m'}</option>
                      <option value="6">{isImperial ? '20 ft' : '6 m'}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Rod Ø {isImperial ? '(in)' : '(mm)'}</label>
                    <select value={gndRodDiameter} onChange={e => setGndRodDiameter(e.target.value)}>
                      <option value="0.014">{isImperial ? '0.55 in' : '14 mm'}</option>
                      <option value="0.016">{isImperial ? '0.63 in' : '16 mm'}</option>
                      <option value="0.020">{isImperial ? '0.79 in' : '20 mm'}</option>
                      <option value="0.025">{isImperial ? '0.98 in' : '25 mm'}</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">🎯</span>Target resistance (Ω)</label>
                  <select value={gndTargetR} onChange={e => setGndTargetR(e.target.value)}>
                    <option value="1">1 Ω (Telco)</option>
                    <option value="2">2 Ω (Data center)</option>
                    <option value="4">4 Ω (Substation)</option>
                    <option value="10">10 Ω (Building)</option>
                    <option value="20">20 Ω (Lightning)</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Number of rods</label>
                    <div className="input-wrapper">
                      <input type="number" min="1" max="50" value={gndNumRods} onChange={e => setGndNumRods(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Spacing ({isImperial ? 'ft' : 'm'})</label>
                    <div className="input-wrapper">
                      <input type="number" step="0.5" value={gndSpacing} onChange={e => setGndSpacing(e.target.value)} />
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={gndLoading}>
                  {gndLoading ? <><span className="spinner"></span>Calculating...</> : 'Calculate'}
                </button>
              </form>
            </div>
            {gndResults && (
              <div className="card results">
                {gndResults.status === 'success' ? (
                  <>
                    <div className="result-row-compact">
                      <div className="result-compact"><span className="result-compact-label">Single rod</span><span className="result-compact-value">{gndResults.results.single_rod_ohm}<span className="unit">Ω</span></span></div>
                      <div className="result-compact" style={!gndResults.results.meets_target ? {backgroundColor:'rgba(239,68,68,0.2)',borderColor:'rgba(239,68,68,0.5)'} : {backgroundColor:'rgba(34,197,94,0.2)',borderColor:'rgba(34,197,94,0.5)'}}>
                        <span className="result-compact-label">Total</span>
                        <span className="result-compact-value" style={!gndResults.results.meets_target ? {color:'#ef4444'} : {color:'#22c55e'}}>{gndResults.results.total_resistance_ohm}<span className="unit">Ω</span></span>
                      </div>
                      <div className="result-compact"><span className="result-compact-label">Target</span><span className="result-compact-value">{gndResults.results.target_ohm}<span className="unit">Ω</span></span></div>
                    </div>
                    <div className="result-row-compact" style={{marginTop:'0.5rem'}}>
                      <div className="result-compact result-highlight"><span className="result-compact-label">Rods needed</span><span className="result-compact-value">{gndResults.results.rods_needed}<span className="unit">pcs</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Coupling</span><span className="result-compact-value">{gndResults.results.coupling_factor}</span></div>
                      <div className="result-compact"><span className="result-compact-label">{gndResults.results.meets_target ? '✅ OK' : '❌ Fail'}</span><span className="result-compact-value"></span></div>
                    </div>
                  </>
                ) : <ErrorBlock detail={gndResults.detail} />}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 8. COST TAB                                                */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'cost' && (
          <>
            <header className="header"><h1>Electricity cost</h1></header>
            <div className="card">
              <form onSubmit={handleCostCalc}>
                <div className="form-group">
                  <label><span className="label-icon">🔌</span>Load (kW)</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.1" value={costLoadKw} onChange={e => setCostLoadKw(e.target.value)} placeholder="e.g. 50" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Hours/day</label>
                    <div className="input-wrapper">
                      <input type="number" step="0.5" value={costHours} onChange={e => setCostHours(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Days/month</label>
                    <div className="input-wrapper">
                      <input type="number" step="1" value={costDays} onChange={e => setCostDays(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price (€/kWh)</label>
                    <div className="input-wrapper">
                      <input type="number" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Demand (€/kW)</label>
                    <div className="input-wrapper">
                      <input type="number" step="0.1" value={costDemand} onChange={e => setCostDemand(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Power Factor</label>
                    <select value={costPf} onChange={e => setCostPf(e.target.value)}>
                      <option value="0.7">0.7</option><option value="0.8">0.8</option>
                      <option value="0.9">0.9</option><option value="1">1.0</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Efficiency (%)</label>
                    <div className="input-wrapper">
                      <input type="number" step="1" min="1" max="100" value={costEfficiency} onChange={e => setCostEfficiency(e.target.value)} />
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={costLoading}>
                  {costLoading ? <><span className="spinner"></span>Calculating...</> : 'Calculate'}
                </button>
              </form>
            </div>
            {costResults && (
              <div className="card results">
                {costResults.status === 'success' ? (
                  <>
                    <div className="result-row-compact">
                      <div className="result-compact"><span className="result-compact-label">Daily</span><span className="result-compact-value">{costResults.results.daily_kwh}<span className="unit">kWh</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Monthly</span><span className="result-compact-value">{costResults.results.monthly_kwh}<span className="unit">kWh</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Yearly</span><span className="result-compact-value">{costResults.results.yearly_kwh.toLocaleString()}<span className="unit">kWh</span></span></div>
                    </div>
                    <div className="result-row-compact" style={{marginTop:'0.5rem'}}>
                      <div className="result-compact"><span className="result-compact-label">Energy</span><span className="result-compact-value">{costResults.results.monthly_energy_eur}<span className="unit">€/mo</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Demand</span><span className="result-compact-value">{costResults.results.monthly_demand_eur}<span className="unit">€/mo</span></span></div>
                      <div className="result-compact result-highlight"><span className="result-compact-label">Total</span><span className="result-compact-value">{costResults.results.monthly_total_eur}<span className="unit">€/mo</span></span></div>
                    </div>
                    <div className="result-row-compact" style={{marginTop:'0.5rem'}}>
                      <div className="result-compact result-highlight"><span className="result-compact-label">Yearly</span><span className="result-compact-value">{costResults.results.yearly_total_eur.toLocaleString()}<span className="unit">€/yr</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">kVA</span><span className="result-compact-value">{costResults.results.apparent_power_kva}<span className="unit">kVA</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">CO₂</span><span className="result-compact-value">{costResults.results.co2_yearly_t}<span className="unit">t/yr</span></span></div>
                    </div>
                  </>
                ) : <ErrorBlock detail={costResults.detail} />}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 9. MOTOR TAB                                               */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'motor' && (
          <>
            <header className="header"><h1>Motor starting</h1></header>
            <div className="card">
              <form onSubmit={handleMotorCalc}>
                <div className="form-group">
                  <label><span className="label-icon">⚙️</span>Motor power (kW)</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.1" value={motorKw} onChange={e => setMotorKw(e.target.value)} placeholder="e.g. 15" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Voltage (V)</label>
                    <select value={motorVoltage} onChange={e => setMotorVoltage(e.target.value)}>
                      <option value="230">230V</option><option value="400">400V</option>
                      <option value="690">690V</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Poles</label>
                    <select value={motorPoles} onChange={e => setMotorPoles(e.target.value)}>
                      <option value="2">2 (3000 RPM)</option><option value="4">4 (1500 RPM)</option>
                      <option value="6">6 (1000 RPM)</option><option value="8">8 (750 RPM)</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Efficiency (%)</label>
                    <div className="input-wrapper">
                      <input type="number" step="0.5" value={motorEfficiency} onChange={e => setMotorEfficiency(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Power Factor</label>
                    <select value={motorPf} onChange={e => setMotorPf(e.target.value)}>
                      <option value="0.75">0.75</option><option value="0.8">0.8</option>
                      <option value="0.85">0.85</option><option value="0.9">0.9</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label><span className="label-icon">🚀</span>Starting method</label>
                  <select value={motorStarting} onChange={e => setMotorStarting(e.target.value)}>
                    <option value="DOL">Direct On-Line (DOL)</option>
                    <option value="Star-Delta">Star-Delta (Y-Δ)</option>
                    <option value="Soft-Starter">Soft Starter</option>
                    <option value="VFD">VFD (Variable Frequency Drive)</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={motorLoading}>
                  {motorLoading ? <><span className="spinner"></span>Calculating...</> : 'Calculate'}
                </button>
              </form>
            </div>
            {motorResults && (
              <div className="card results">
                {motorResults.status === 'success' ? (
                  <>
                    <div className="result-row-compact">
                      <div className="result-compact"><span className="result-compact-label">FLA</span><span className="result-compact-value">{motorResults.results.fla}<span className="unit">A</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">LRC</span><span className="result-compact-value">{motorResults.results.lrc}<span className="unit">A</span></span></div>
                      <div className="result-compact result-highlight"><span className="result-compact-label">Starting I</span><span className="result-compact-value">{motorResults.results.starting_current}<span className="unit">A</span></span></div>
                    </div>
                    <div className="result-row-compact" style={{marginTop:'0.5rem'}}>
                      <div className="result-compact"><span className="result-compact-label">Method</span><span className="result-compact-value" style={{fontSize:'0.75rem'}}>{motorResults.results.starting_method}</span></div>
                      <div className="result-compact"><span className="result-compact-label">Torque</span><span className="result-compact-value">{motorResults.results.starting_torque_pct}<span className="unit">%</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">RPM</span><span className="result-compact-value">{motorResults.results.full_load_rpm}</span></div>
                    </div>
                    <div className="result-row-compact" style={{marginTop:'0.5rem'}}>
                      <div className="result-compact"><span className="result-compact-label">Cable</span><span className="result-compact-value">{isImperial ? `AWG ${closestAwg(motorResults.results.cable_mm2)}` : motorResults.results.cable_mm2}<span className="unit">{isImperial ? `(${motorResults.results.cable_mm2} mm²)` : 'mm²'}</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Breaker</span><span className="result-compact-value">{motorResults.results.circuit_breaker_a}<span className="unit">A</span></span></div>
                      <div className="result-compact"><span className="result-compact-label">Contactor</span><span className="result-compact-value">{motorResults.results.contactor_a}<span className="unit">A</span></span></div>
                    </div>
                    <div className="result-row-compact" style={{marginTop:'0.5rem'}}>
                      <div className="result-compact"><span className="result-compact-label">Overload</span><span className="result-compact-value">{motorResults.results.overload_min}–{motorResults.results.overload_max}<span className="unit">A</span></span></div>
                    </div>
                  </>
                ) : <ErrorBlock detail={motorResults.detail} />}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 10. IMPERIAL CONVERTER TAB                                 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'imperial' && (
          <>
            <header className="header"><h1>Imperial ⇄ Metric</h1></header>

            {/* AWG ↔ mm² */}
            <div className="card">
              <h3 className="converter-title">🔗 Cable: AWG ↔ mm²</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>AWG</label>
                  <select value={impAwgVal} onChange={e => { setImpAwgVal(e.target.value); setImpMm2Val(convAwgToMm2(e.target.value)) }}>
                    <option value="">Select AWG...</option>
                    {awgTable.map(a => <option key={a.awg} value={a.awg}>{a.awg}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>mm²</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.01" value={impMm2Val} onChange={e => { setImpMm2Val(e.target.value); setImpAwgVal('') }} placeholder="mm²" />
                  </div>
                </div>
              </div>
              {impMm2Val && !impAwgVal && (
                <div className="converter-result">≈ {convMm2ToAwg(impMm2Val)}</div>
              )}
              {impAwgVal && impMm2Val && (
                <div className="converter-result">{impAwgVal} AWG = {impMm2Val} mm²</div>
              )}
            </div>

            {/* Length: Feet ↔ cm */}
            <div className="card">
              <h3 className="converter-title">📏 Length</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Feet</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.01" value={impFeetVal} onChange={e => { setImpFeetVal(e.target.value); setImpCmVal(e.target.value ? (parseFloat(e.target.value) * 30.48).toFixed(2) : '') }} placeholder="ft" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Centimeters</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.01" value={impCmVal} onChange={e => { setImpCmVal(e.target.value); setImpFeetVal(e.target.value ? (parseFloat(e.target.value) / 30.48).toFixed(4) : '') }} placeholder="cm" />
                  </div>
                </div>
              </div>
              <div className="form-row" style={{marginTop: '0.75rem'}}>
                <div className="form-group">
                  <label>Inches</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.01" value={impInchVal} onChange={e => { setImpInchVal(e.target.value); setImpMmVal(e.target.value ? (parseFloat(e.target.value) * 25.4).toFixed(2) : '') }} placeholder="in" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Millimeters</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.01" value={impMmVal} onChange={e => { setImpMmVal(e.target.value); setImpInchVal(e.target.value ? (parseFloat(e.target.value) / 25.4).toFixed(4) : '') }} placeholder="mm" />
                  </div>
                </div>
              </div>
              <div className="form-row" style={{marginTop: '0.75rem'}}>
                <div className="form-group">
                  <label>Miles</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.01" value={impMileVal} onChange={e => { setImpMileVal(e.target.value); setImpKmVal(e.target.value ? (parseFloat(e.target.value) * 1.60934).toFixed(4) : '') }} placeholder="mi" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Kilometers</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.01" value={impKmVal} onChange={e => { setImpKmVal(e.target.value); setImpMileVal(e.target.value ? (parseFloat(e.target.value) / 1.60934).toFixed(4) : '') }} placeholder="km" />
                  </div>
                </div>
              </div>
            </div>

            {/* Area: sq ft ↔ m² */}
            <div className="card">
              <h3 className="converter-title">📐 Area</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Square feet</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.01" value={impSqftVal} onChange={e => { setImpSqftVal(e.target.value); setImpSqmVal(e.target.value ? (parseFloat(e.target.value) * 0.092903).toFixed(4) : '') }} placeholder="sq ft" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Square meters</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.01" value={impSqmVal} onChange={e => { setImpSqmVal(e.target.value); setImpSqftVal(e.target.value ? (parseFloat(e.target.value) / 0.092903).toFixed(4) : '') }} placeholder="m²" />
                  </div>
                </div>
              </div>
            </div>

            {/* Weight: lbs ↔ kg, oz ↔ g */}
            <div className="card">
              <h3 className="converter-title">⚖️ Weight</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Pounds (lbs)</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.01" value={impLbVal} onChange={e => { setImpLbVal(e.target.value); setImpKgVal(e.target.value ? (parseFloat(e.target.value) * 0.453592).toFixed(4) : '') }} placeholder="lbs" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Kilograms</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.01" value={impKgVal} onChange={e => { setImpKgVal(e.target.value); setImpLbVal(e.target.value ? (parseFloat(e.target.value) / 0.453592).toFixed(4) : '') }} placeholder="kg" />
                  </div>
                </div>
              </div>
              <div className="form-row" style={{marginTop: '0.75rem'}}>
                <div className="form-group">
                  <label>Ounces (oz)</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.01" value={impOzVal} onChange={e => { setImpOzVal(e.target.value); setImpGVal(e.target.value ? (parseFloat(e.target.value) * 28.3495).toFixed(2) : '') }} placeholder="oz" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Grams</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.01" value={impGVal} onChange={e => { setImpGVal(e.target.value); setImpOzVal(e.target.value ? (parseFloat(e.target.value) / 28.3495).toFixed(4) : '') }} placeholder="g" />
                  </div>
                </div>
              </div>
            </div>

            {/* Temperature: °F ↔ °C */}
            <div className="card">
              <h3 className="converter-title">🌡️ Temperature</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Fahrenheit (°F)</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.1" value={impFVal} onChange={e => { setImpFVal(e.target.value); setImpCVal(e.target.value ? ((parseFloat(e.target.value) - 32) * 5/9).toFixed(2) : '') }} placeholder="°F" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Celsius (°C)</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.1" value={impCVal} onChange={e => { setImpCVal(e.target.value); setImpFVal(e.target.value ? (parseFloat(e.target.value) * 9/5 + 32).toFixed(2) : '') }} placeholder="°C" />
                  </div>
                </div>
              </div>
            </div>

            {/* AWG Reference Table */}
            <div className="card">
              <h3 className="converter-title">📋 AWG Reference Table</h3>
              <div className="awg-table">
                <div className="awg-table-header">
                  <span>AWG</span><span>mm²</span><span>AWG</span><span>mm²</span>
                </div>
                {awgTable.filter((_, i) => i % 2 === 0).map((a, i) => (
                  <div key={i} className="awg-table-row">
                    <span>{a.awg}</span><span>{a.mm2}</span>
                    {awgTable[i * 2 + 1] ? <><span>{awgTable[i * 2 + 1].awg}</span><span>{awgTable[i * 2 + 1].mm2}</span></> : <><span></span><span></span></>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SETTINGS TAB                                               */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <>
            <header className="header"><h1>Settings</h1></header>
            <div className="card">
              <div className="settings-item">
                <div className="settings-label">
                  <span className="settings-icon">🎨</span>
                  <div>
                    <div className="settings-title">Theme</div>
                    <div className="settings-desc">Switch between dark and light mode</div>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={theme === 'light'} onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
                </label>
              </div>
              <div className="settings-item">
                <div className="settings-label">
                  <span className="settings-icon">📐</span>
                  <div>
                    <div className="settings-title">Unit System</div>
                    <div className="settings-desc">Switch between Metric (SI) and Imperial units</div>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={isImperial} onChange={() => setUnitSystem(isImperial ? 'metric' : 'imperial')} />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">{isImperial ? 'Imperial' : 'Metric'}</span>
                </label>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default App
