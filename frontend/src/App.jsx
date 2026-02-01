import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import serverIcon from './assets/server-icon.svg'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  // UPS Tab state
  const [itLoad, setItLoad] = useState('')
  const [runtimeMin, setRuntimeMin] = useState('')
  const [redundancyLevel, setRedundancyLevel] = useState('2N')
  const [powerFactor, setPowerFactor] = useState('0.9')
  const [growthMargin, setGrowthMargin] = useState('20')
  const [safetyMargin, setSafetyMargin] = useState('10')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('power')

  // Power Tab state
  const [powerLoad, setPowerLoad] = useState('')
  const [phases, setPhases] = useState('3F_400V')
  const [cable, setCable] = useState('2.5')
  const [cableType, setCableType] = useState('Cu')
  const [cableLength, setCableLength] = useState('')
  const [mounting, setMounting] = useState('open')
  const [powerFactorPower, setPowerFactorPower] = useState('0.9')
  const [powerResults, setPowerResults] = useState(null)
  const [powerLoading, setPowerLoading] = useState(false)

  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Auto-update UPS results when inputs change (only if results already exist)
  useEffect(() => {
    if (results && itLoad && runtimeMin) {
      const timer = setTimeout(() => {
        recalculateUPS()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [itLoad, runtimeMin, redundancyLevel, powerFactor, growthMargin, safetyMargin])

  // Auto-update Power results when inputs change (only if results already exist)
  useEffect(() => {
    if (powerResults && powerLoad && cableLength) {
      const timer = setTimeout(() => {
        recalculatePower()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [powerLoad, phases, cable, cableType, cableLength, mounting, powerFactorPower])

  const recalculateUPS = async () => {
    try {
      const response = await axios.post(`${API_URL}/calculate`, {
        it_load_kw: parseFloat(itLoad),
        runtime_min: parseInt(runtimeMin),
        redundancy_level: redundancyLevel,
        power_factor: parseFloat(powerFactor),
        growth_margin: parseInt(growthMargin),
        safety_margin: parseInt(safetyMargin)
      })
      setResults(response.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const recalculatePower = async () => {
    try {
      const response = await axios.post(`${API_URL}/calculate-power`, {
        load_kw: parseFloat(powerLoad),
        phases: phases,
        cable_mm2: parseFloat(cable),
        cable_type: cableType,
        length_m: parseFloat(cableLength),
        mounting: mounting,
        power_factor: parseFloat(powerFactorPower)
      })
      setPowerResults(response.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleCalculate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/calculate`, {
        it_load_kw: parseFloat(itLoad),
        runtime_min: parseInt(runtimeMin),
        redundancy_level: redundancyLevel,
        power_factor: parseFloat(powerFactor),
        growth_margin: parseInt(growthMargin),
        safety_margin: parseInt(safetyMargin)
      })
      setResults(response.data)
    } catch (error) {
      console.error('Error:', error)
      setResults({ status: 'error', detail: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePDF = async () => {
    try {
      await axios.post(`${API_URL}/generate-pdf`, {
        it_load_kw: parseFloat(itLoad),
        runtime_min: parseInt(runtimeMin),
        redundancy_level: redundancyLevel,
        power_factor: parseFloat(powerFactor),
        growth_margin: parseInt(growthMargin),
        safety_margin: parseInt(safetyMargin)
      })
      alert('PDF generated successfully!')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate PDF')
    }
  }

  const handlePowerCalculate = async (e) => {
    e.preventDefault()
    setPowerLoading(true)
    try {
      const response = await axios.post(`${API_URL}/calculate-power`, {
        load_kw: parseFloat(powerLoad),
        phases: phases,
        cable_mm2: parseFloat(cable),
        cable_type: cableType,
        length_m: parseFloat(cableLength),
        mounting: mounting,
        power_factor: parseFloat(powerFactorPower)
      })
      setPowerResults(response.data)
    } catch (error) {
      console.error('Error:', error)
      setPowerResults({ status: 'error', detail: error.message })
    } finally {
      setPowerLoading(false)
    }
  }

  return (
    <div className="app">
      {/* Navigation Header */}
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => setActiveTab('power')} style={{cursor: 'pointer'}}>
          <span className="brand-icon">⚡</span>
          <span className="brand-text">Electrical</span>
        </div>
        
        <div className="navbar-tabs">
          <button 
            className={`nav-tab ${activeTab === 'power' ? 'active' : ''}`}
            onClick={() => setActiveTab('power')}
          >
            ⚡ Power
          </button>
          <button 
            className={`nav-tab ${activeTab === 'ups' ? 'active' : ''}`}
            onClick={() => setActiveTab('ups')}
          >
            🖩️ UPS
          </button>
          <button 
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </div>

        <div className="navbar-actions">
          <button 
            className="burger-btn" 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className="burger-line"></span>
            <span className="burger-line"></span>
            <span className="burger-line"></span>
          </button>
          
          {menuOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => { setActiveTab('power'); setMenuOpen(false); }}>
                ⚡ Power
              </button>
              <button className="dropdown-item" onClick={() => { setActiveTab('ups'); setMenuOpen(false); }}>
                🖩️ UPS
              </button>
              <button className="dropdown-item" onClick={() => { setActiveTab('settings'); setMenuOpen(false); }}>
                ⚙️ Settings
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={() => setMenuOpen(false)}>
                📄 Documentation
              </button>
              <button className="dropdown-item" onClick={() => setMenuOpen(false)}>
                ℹ️ About
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Overlay for closing menu */}
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>}

      <div className="container">
        {activeTab === 'ups' && (
          <>
            <header className="header">
              <h1>UPS calculator</h1>
            </header>
          
            <div className="card">
              <form onSubmit={handleCalculate}>
          <div className="form-group">
            <label>
              <span className="label-icon">🔌</span>
              IT Load (kW)
            </label>
            <div className="input-wrapper">
              <input
                type="number"
                step="0.1"
                value={itLoad}
                onChange={(e) => setItLoad(e.target.value)}
                placeholder="e.g. 100"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              <span className="label-icon">⏱️</span>
              Runtime (min.)
            </label>
            <select 
              value={runtimeMin} 
              onChange={(e) => setRuntimeMin(e.target.value)}
              required
            >
              <option value="">Select...</option>
              <option value="5">5 min.</option>
              <option value="10">10 min.</option>
              <option value="15">15 min.</option>
              <option value="20">20 min.</option>
              <option value="25">25 min.</option>
              <option value="30">30 min.</option>
              <option value="35">35 min.</option>
              <option value="40">40 min.</option>
              <option value="45">45 min.</option>
              <option value="50">50 min.</option>
              <option value="55">55 min.</option>
              <option value="60">60 min.</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <span className="label-icon">🛡️</span>
              Redundancy Level
            </label>
            <select 
              value={redundancyLevel} 
              onChange={(e) => setRedundancyLevel(e.target.value)}
            >
              <option value="N">N (No Redundancy)</option>
              <option value="N+1">N+1 (Parallel Redundant)</option>
              <option value="2N">2N (Dual Path)</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <span className="label-icon">⚡</span>
              Power Factor
            </label>
            <select 
              value={powerFactor} 
              onChange={(e) => setPowerFactor(e.target.value)}
            >
              <option value="0.7">0.7</option>
              <option value="0.8">0.8</option>
              <option value="0.9">0.9</option>
              <option value="1">1.0</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <span className="label-icon">📈</span>
              Growth Margin
            </label>
            <select 
              value={growthMargin} 
              onChange={(e) => setGrowthMargin(e.target.value)}
            >
              <option value="10">10%</option>
              <option value="20">20%</option>
              <option value="30">30%</option>
              <option value="40">40%</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <span className="label-icon">🔒</span>
              Safety Margin
            </label>
            <select 
              value={safetyMargin} 
              onChange={(e) => setSafetyMargin(e.target.value)}
            >
              <option value="10">10%</option>
              <option value="20">20%</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Calculating...
              </>
            ) : (
              'Calculate'
            )}
          </button>
        </form>
      </div>

      {results && (
        <div className="card results" style={{padding: '1rem'}}>
          {results.status === 'success' ? (
            <>
              <div className="result-row-compact">
                <div className="result-compact">
                  <span className="result-compact-label">UPS</span>
                  <span className="result-compact-value">{results.results.ups_unit_min_kw}<span className="unit">kW</span></span>
                </div>
                <div className="result-compact">
                  <span className="result-compact-label">UPS</span>
                  <span className="result-compact-value">{results.results.ups_unit_min_kva}<span className="unit">kVA</span></span>
                </div>
                <div className="result-compact">
                  <span className="result-compact-label">Battery</span>
                  <span className="result-compact-value">{results.results.total_battery_ah}<span className="unit">Ah</span></span>
                </div>
              </div>
              <div className="result-row-compact" style={{marginTop: '0.5rem'}}>
                <div className="result-compact">
                  <span className="result-compact-label">Heat</span>
                  <span className="result-compact-value">{results.results.heat_dissipation_btu.toLocaleString()}<span className="unit">BTU</span></span>
                </div>
                <div className="result-compact">
                  <span className="result-compact-label">PF</span>
                  <span className="result-compact-value">{results.results.power_factor}</span>
                </div>
                <div className="result-compact">
                  <span className="result-compact-label">Growth</span>
                  <span className="result-compact-value">+{results.results.growth_margin_pct}<span className="unit">%</span></span>
                </div>
              </div>
              
              <button onClick={handleGeneratePDF} className="btn btn-success" style={{marginTop: '0.75rem', padding: '0.5rem 1rem', fontSize: '0.875rem'}}>
                📄 Generate PDF
              </button>
            </>
          ) : (
            <div className="error-container">
              <span className="error-icon">❌</span>
              <p className="error-message">Error: {results.detail}</p>
            </div>
          )}
        </div>
      )}
          </>
        )}

        {activeTab === 'power' && (
          <>
            <header className="header">
              <h1>Power calculator</h1>
            </header>
          
            <div className="card">
              <form onSubmit={handlePowerCalculate}>
                <div className="form-group">
                  <label>
                    <span className="label-icon">🔌</span>
                    Load (kW)
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      step="0.1"
                      value={powerLoad}
                      onChange={(e) => setPowerLoad(e.target.value)}
                      placeholder="e.g. 10"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <span className="label-icon">⚡</span>
                    Phases
                  </label>
                  <select 
                    value={phases} 
                    onChange={(e) => setPhases(e.target.value)}
                  >
                    <option value="1F_230V">1F 230V</option>
                    <option value="3F_400V">3F 400V</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <span className="label-icon">⚡</span>
                    Power Factor
                  </label>
                  <select 
                    value={powerFactorPower} 
                    onChange={(e) => setPowerFactorPower(e.target.value)}
                  >
                    <option value="0.7">0.7</option>
                    <option value="0.8">0.8</option>
                    <option value="0.9">0.9</option>
                    <option value="1">1.0</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <span className="label-icon">🔗</span>
                    Cable Type
                  </label>
                  <select 
                    value={cableType} 
                    onChange={(e) => setCableType(e.target.value)}
                  >
                    <option value="Cu">Copper (Cu)</option>
                    <option value="Al">Aluminum (Al)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <span className="label-icon">🔗</span>
                    Cable (mm²)
                  </label>
                  <select 
                    value={cable} 
                    onChange={(e) => setCable(e.target.value)}
                  >
                    <option value="1.5">1.5 mm²</option>
                    <option value="2.5">2.5 mm²</option>
                    <option value="4">4 mm²</option>
                    <option value="6">6 mm²</option>
                    <option value="10">10 mm²</option>
                    <option value="16">16 mm²</option>
                    <option value="25">25 mm²</option>
                    <option value="35">35 mm²</option>
                    <option value="50">50 mm²</option>
                    <option value="70">70 mm²</option>
                    <option value="95">95 mm²</option>
                    <option value="120">120 mm²</option>
                    <option value="150">150 mm²</option>
                    <option value="185">185 mm²</option>
                    <option value="240">240 mm²</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <span className="label-icon">📏</span>
                    Length (m)
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      step="1"
                      value={cableLength}
                      onChange={(e) => setCableLength(e.target.value)}
                      placeholder="e.g. 50"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <span className="label-icon">📦</span>
                    Mounting
                  </label>
                  <select 
                    value={mounting} 
                    onChange={(e) => setMounting(e.target.value)}
                  >
                    <option value="open">Open</option>
                    <option value="conduit">In conduit</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" disabled={powerLoading}>
                  {powerLoading ? (
                    <>
                      <span className="spinner"></span>
                      Calculating...
                    </>
                  ) : (
                    'Calculate'
                  )}
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
                      <div className="result-compact" style={powerResults.results.cable_max_a < powerResults.results.circuit_breaker_a ? {backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)'} : {}}>
                        <span className="result-compact-label">Cable</span>
                        <span className="result-compact-value" style={powerResults.results.cable_max_a < powerResults.results.circuit_breaker_a ? {color: '#ef4444'} : {}}>{powerResults.results.cable_max_a}<span className="unit">A</span></span>
                      </div>
                      <div className="result-compact">
                        <span className="result-compact-label">Breaker</span>
                        <span className="result-compact-value">{powerResults.results.circuit_breaker_a}<span className="unit">A</span></span>
                      </div>
                    </div>
                    <div className="result-row-compact" style={{marginTop: '0.5rem'}}>
                      <div className="result-compact" style={parseFloat(powerResults.results.voltage_drop_pct) >= 4.01 ? {backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)'} : {}}>
                        <span className="result-compact-label">Voltage Drop</span>
                        <span className="result-compact-value" style={parseFloat(powerResults.results.voltage_drop_pct) >= 4.01 ? {color: '#ef4444'} : {}}>{powerResults.results.voltage_drop_pct}<span className="unit">%</span></span>
                      </div>
                      <div className="result-compact">
                        <span className="result-compact-label">Short Circuit</span>
                        <span className="result-compact-value">{powerResults.results.short_circuit_ka}<span className="unit">kA</span></span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="error-container">
                    <span className="error-icon">❌</span>
                    <p className="error-message">Error: {powerResults.detail}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <header className="header">
              <h1>Settings</h1>
            </header>
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
                  <input
                    type="checkbox"
                    checked={theme === 'light'}
                    onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
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

