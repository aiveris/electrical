from flask import Flask, jsonify, request
from flask_cors import CORS
from fpdf import FPDF
import os

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5173",
    "http://localhost:3000",
    "https://elektrotechnika.netlify.app",
    "https://aiveris.pythonanywhere.com"
], supports_credentials=True, methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json()
        it_load_kw = float(data.get('it_load_kw', 0))
        runtime_min = int(data.get('runtime_min', 0))
        redundancy_level = data.get('redundancy_level', '2N')
        power_factor = float(data.get('power_factor', 0.9))
        growth_margin = int(data.get('growth_margin', 20)) / 100
        safety_margin = int(data.get('safety_margin', 10)) / 100
        
        # Logika: skaičiuojame su Power Factor, Growth ir Safety margins
        apparent_power_kva = it_load_kw / power_factor
        design_load = apparent_power_kva * (1 + growth_margin) * (1 + safety_margin)
        
        # Redundancijos faktorius
        if redundancy_level == "2N":
            ups_rating = design_load
            system_setup = "Dual Path (A+B)"
        elif redundancy_level == "N+1":
            ups_rating = design_load / 2
            system_setup = "Parallel Redundant"
        else:
            ups_rating = design_load
            system_setup = "Single Path"

        # Baterijų skaičiavimas (supaprastintas)
        efficiency = 0.92
        dc_bus = 480
        runtime_hr = runtime_min / 60
        required_ah = (design_load * 1000 * runtime_hr) / (dc_bus * efficiency)

        return jsonify({
            "status": "success",
            "configuration": system_setup,
            "results": {
                "ups_unit_min_kw": round(ups_rating, 2),
                "ups_unit_min_kva": round(ups_rating / power_factor, 2),
                "total_battery_ah": round(required_ah, 2),
                "heat_dissipation_btu": round(design_load * 3412, 0),
                "power_factor": power_factor,
                "growth_margin_pct": int(growth_margin * 100),
                "safety_margin_pct": int(safety_margin * 100)
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 400

@app.route('/generate-pdf', methods=['POST'])
def generate_pdf():
    try:
        data = request.get_json()
        it_load_kw = float(data.get('it_load_kw', 0))
        runtime_min = int(data.get('runtime_min', 0))
        redundancy_level = data.get('redundancy_level', '2N')
        power_factor = float(data.get('power_factor', 0.9))
        growth_margin = int(data.get('growth_margin', 20))
        safety_margin = int(data.get('safety_margin', 10))
        
        # Calculate values (same as /calculate)
        growth_factor = growth_margin / 100
        safety_factor = safety_margin / 100
        apparent_power_kva = it_load_kw / power_factor
        design_load = apparent_power_kva * (1 + growth_factor) * (1 + safety_factor)
        
        if redundancy_level == "2N":
            ups_rating = design_load
            system_setup = "Dual Path (A+B)"
        elif redundancy_level == "N+1":
            ups_rating = design_load / 2
            system_setup = "Parallel Redundant"
        else:
            ups_rating = design_load
            system_setup = "Single Path"
        
        efficiency = 0.92
        dc_bus = 480
        runtime_hr = runtime_min / 60
        required_ah = (design_load * 1000 * runtime_hr) / (dc_bus * efficiency)
        heat_btu = design_load * 3412
        
        # Create PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Helvetica", 'B', 16)
        
        # Title
        pdf.cell(200, 10, txt="UPS Calculator Report", ln=True, align='C')
        pdf.ln(10)
        
        # Input Parameters Section
        pdf.set_font("Helvetica", 'B', 12)
        pdf.cell(200, 8, txt="Input Parameters", ln=True)
        pdf.set_font("Helvetica", size=11)
        pdf.cell(200, 7, txt=f"IT Load: {it_load_kw} kW", ln=True)
        pdf.cell(200, 7, txt=f"Runtime: {runtime_min} min", ln=True)
        pdf.cell(200, 7, txt=f"Redundancy Level: {redundancy_level}", ln=True)
        pdf.cell(200, 7, txt=f"Power Factor: {power_factor}", ln=True)
        pdf.cell(200, 7, txt=f"Growth Margin: {growth_margin}%", ln=True)
        pdf.cell(200, 7, txt=f"Safety Margin: {safety_margin}%", ln=True)
        pdf.ln(5)
        
        # Results Section
        pdf.set_font("Helvetica", 'B', 12)
        pdf.cell(200, 8, txt="Calculation Results", ln=True)
        pdf.set_font("Helvetica", size=11)
        pdf.cell(200, 7, txt=f"Configuration: {system_setup}", ln=True)
        pdf.cell(200, 7, txt=f"UPS Capacity: {ups_rating:.2f} kW / {ups_rating/power_factor:.2f} kVA", ln=True)
        pdf.cell(200, 7, txt=f"Battery Capacity: {required_ah:.2f} Ah", ln=True)
        pdf.cell(200, 7, txt=f"Heat Dissipation: {heat_btu:.0f} BTU/h", ln=True)
        pdf.ln(5)
        
        # Recommendations
        pdf.set_font("Helvetica", 'B', 12)
        pdf.cell(200, 8, txt="Engineering Recommendations", ln=True)
        pdf.set_font("Helvetica", size=11)
        pdf.multi_cell(0, 7, txt=(
            f"1. Each UPS system must be at least {ups_rating:.2f} kW capacity.\n"
            f"2. Battery array must provide at least {required_ah:.2f} Ah capacity.\n"
            f"3. Recommended topology: {system_setup}."
        ))

        file_path = "ups_report.pdf"
        pdf.output(file_path)
        
        return jsonify({"status": "success", "message": "PDF generated", "file": file_path})
    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 400

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"})

@app.route('/calculate-power', methods=['POST'])
def calculate_power():
    try:
        data = request.get_json()
        load_kw = float(data.get('load_kw', 0))
        phases = data.get('phases', '3F_400V')
        cable_mm2 = float(data.get('cable_mm2', 2.5))
        cable_type = data.get('cable_type', 'Cu')
        length_m = float(data.get('length_m', 10))
        mounting = data.get('mounting', 'open')
        power_factor = float(data.get('power_factor', 0.9))
        
        # Resistivity at 70°C (ohm*mm²/m): Copper = 0.0225, Aluminum = 0.036
        if cable_type == 'Cu':
            resistivity = 0.0225
        else:  # Al
            resistivity = 0.036
        
        # Voltage and phase factor
        if phases == '1F_230V':
            voltage = 230
        else:  # 3F_400V
            voltage = 400
        
        # Calculate current: I = P / (V * pf) for single phase, I = P / (sqrt(3) * V * pf) for three phase
        if phases == '1F_230V':
            current_a = (load_kw * 1000) / (voltage * power_factor)
        else:
            current_a = (load_kw * 1000) / (voltage * 1.732 * power_factor)
        
        # Cable resistance per meter (ohm/m)
        resistance_per_m = resistivity / cable_mm2
        
        # Voltage drop calculation
        if phases == '1F_230V':
            voltage_drop_v = 2 * length_m * current_a * resistance_per_m
        else:
            voltage_drop_v = 1.732 * length_m * current_a * resistance_per_m
        
        voltage_drop_pct = (voltage_drop_v / voltage) * 100
        
        # Derating factor for conduit mounting
        if mounting == 'conduit':
            derating = 0.8
        else:
            derating = 1.0
        
        # Maximum current capacity tables (IEC 60364-5-52)
        # Copper cables - open air installation
        cu_open_table = {
            1.5: 19.5, 2.5: 27, 4: 36, 6: 46, 10: 65, 16: 87,
            25: 114, 35: 141, 50: 182, 70: 234, 95: 284, 
            120: 330, 150: 381, 185: 436, 240: 515
        }
        # Copper cables - in conduit
        cu_conduit_table = {
            1.5: 15, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 68,
            25: 89, 35: 110, 50: 134, 70: 171, 95: 207, 
            120: 239, 150: 275, 185: 314, 240: 370
        }
        # Aluminum cables - open air installation
        al_open_table = {
            2.5: 21, 4: 28, 6: 36, 10: 50, 16: 67,
            25: 88, 35: 109, 50: 140, 70: 181, 95: 220, 
            120: 255, 150: 294, 185: 337, 240: 398
        }
        # Aluminum cables - in conduit
        al_conduit_table = {
            2.5: 16.5, 4: 22, 6: 28, 10: 39, 16: 53,
            25: 70, 35: 86, 50: 104, 70: 133, 95: 161, 
            120: 186, 150: 215, 185: 245, 240: 289
        }
        
        # Select appropriate table
        if cable_type == 'Cu':
            if mounting == 'conduit':
                current_table = cu_conduit_table
            else:
                current_table = cu_open_table
        else:  # Al
            if mounting == 'conduit':
                current_table = al_conduit_table
            else:
                current_table = al_open_table
        
        max_current = current_table.get(cable_mm2, 21)
        
        # Circuit breaker selection - standard sizes
        cb_sizes = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630]
        circuit_breaker = next((cb for cb in cb_sizes if cb >= current_a), cb_sizes[-1])
        
        # Short circuit current estimation (simplified)
        # Assuming transformer impedance of 4% and 630kVA transformer
        transformer_kva = 630
        transformer_impedance_pct = 4
        if phases == '3F_400V':
            isc_transformer = (transformer_kva * 1000) / (1.732 * voltage * (transformer_impedance_pct / 100))
        else:
            isc_transformer = (transformer_kva * 1000) / (voltage * (transformer_impedance_pct / 100))
        
        # Cable impedance limits short circuit
        cable_impedance = resistance_per_m * length_m
        short_circuit_ka = min(isc_transformer, voltage / (cable_impedance * 1.732)) / 1000
        
        return jsonify({
            "status": "success",
            "results": {
                "current_a": round(current_a, 2),
                "voltage_drop_pct": round(voltage_drop_pct, 2),
                "short_circuit_ka": round(short_circuit_ka, 2),
                "cable_max_a": round(max_current, 1),
                "circuit_breaker_a": circuit_breaker,
                "cable_ok": current_a <= max_current
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 400


# ─── 3. Transformer Sizing ───────────────────────────────────────────
@app.route('/calculate-transformer', methods=['POST'])
def calculate_transformer():
    try:
        data = request.get_json()
        loads = data.get('loads', [])  # list of {name, kw, pf, demand_factor}
        growth_pct = float(data.get('growth_pct', 20)) / 100
        
        total_kw = 0
        total_kva = 0
        for load in loads:
            kw = float(load.get('kw', 0))
            pf = float(load.get('pf', 0.9))
            df = float(load.get('demand_factor', 1.0))
            demand_kw = kw * df
            total_kw += demand_kw
            total_kva += demand_kw / pf

        design_kva = total_kva * (1 + growth_pct)

        # Standard transformer sizes (kVA)
        std_sizes = [25, 50, 63, 100, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500]
        selected_kva = next((s for s in std_sizes if s >= design_kva), std_sizes[-1])
        loading_pct = (design_kva / selected_kva) * 100

        # Losses estimate (no-load + load losses)
        no_load_loss_w = selected_kva * 1.8  # ~0.18% typical
        load_loss_w = selected_kva * 8.5 * (loading_pct / 100) ** 2  # ~0.85% at full load

        return jsonify({
            "status": "success",
            "results": {
                "total_demand_kw": round(total_kw, 2),
                "total_demand_kva": round(total_kva, 2),
                "design_kva": round(design_kva, 2),
                "selected_kva": selected_kva,
                "loading_pct": round(loading_pct, 1),
                "no_load_loss_w": round(no_load_loss_w, 0),
                "load_loss_w": round(load_loss_w, 0),
                "total_losses_w": round(no_load_loss_w + load_loss_w, 0)
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 400


# ─── 4. Generator Sizing ─────────────────────────────────────────────
@app.route('/calculate-generator', methods=['POST'])
def calculate_generator():
    try:
        data = request.get_json()
        total_load_kw = float(data.get('total_load_kw', 0))
        motor_starting_kw = float(data.get('motor_starting_kw', 0))
        power_factor = float(data.get('power_factor', 0.8))
        altitude_m = float(data.get('altitude_m', 0))
        temperature_c = float(data.get('temperature_c', 40))
        redundancy = data.get('redundancy', 'N')  # N or N+1

        # Altitude derating: 3.5% per 500m above 1000m
        alt_derating = 1.0
        if altitude_m > 1000:
            alt_derating = 1 - ((altitude_m - 1000) / 500) * 0.035

        # Temperature derating: 2% per 5°C above 40°C
        temp_derating = 1.0
        if temperature_c > 40:
            temp_derating = 1 - ((temperature_c - 40) / 5) * 0.02

        derating_factor = alt_derating * temp_derating

        # Motor starting adds ~3x the motor kW for starting
        peak_kw = total_load_kw + motor_starting_kw * 2.5
        
        # Generator must handle continuous + starting
        continuous_kva = total_load_kw / power_factor
        peak_kva = peak_kw / power_factor

        # Apply derating
        required_kva = peak_kva / derating_factor

        # Standard generator sizes (kVA)
        std_sizes = [20, 30, 40, 50, 60, 80, 100, 125, 150, 200, 250, 300, 350, 400, 500, 625, 750, 800, 1000, 1250, 1500, 2000, 2500]
        
        if redundancy == 'N+1':
            # Each unit carries half load + 1 spare
            unit_kva = required_kva / 2
            selected_kva = next((s for s in std_sizes if s >= unit_kva), std_sizes[-1])
            total_units = 3
            total_system_kva = selected_kva * total_units
        else:
            selected_kva = next((s for s in std_sizes if s >= required_kva), std_sizes[-1])
            total_units = 1
            total_system_kva = selected_kva

        # Fuel consumption estimate (liters/hr at 75% load) ~0.27 L/kWh
        fuel_consumption = selected_kva * power_factor * 0.75 * 0.27

        return jsonify({
            "status": "success",
            "results": {
                "continuous_kva": round(continuous_kva, 2),
                "peak_kva": round(peak_kva, 2),
                "derating_factor": round(derating_factor, 3),
                "required_kva": round(required_kva, 2),
                "selected_kva": selected_kva,
                "total_units": total_units,
                "total_system_kva": total_system_kva,
                "fuel_lph": round(fuel_consumption, 1),
                "loading_pct": round((continuous_kva / total_system_kva) * 100, 1)
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 400


# ─── 5. Power Factor Correction ──────────────────────────────────────
@app.route('/calculate-pfc', methods=['POST'])
def calculate_pfc():
    try:
        data = request.get_json()
        load_kw = float(data.get('load_kw', 0))
        current_pf = float(data.get('current_pf', 0.75))
        target_pf = float(data.get('target_pf', 0.95))
        voltage = float(data.get('voltage', 400))
        
        import math
        
        # Calculate reactive power to compensate
        phi1 = math.acos(current_pf)
        phi2 = math.acos(target_pf)
        
        q_before = load_kw * math.tan(phi1)
        q_after = load_kw * math.tan(phi2)
        q_required = q_before - q_after

        # kVA before and after
        kva_before = load_kw / current_pf
        kva_after = load_kw / target_pf

        # Current reduction
        if voltage > 0:
            current_before = (kva_before * 1000) / (1.732 * voltage)
            current_after = (kva_after * 1000) / (1.732 * voltage)
        else:
            current_before = 0
            current_after = 0

        # Standard capacitor bank sizes (kVAr)
        std_sizes = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 400, 500]
        selected_kvar = next((s for s in std_sizes if s >= q_required), std_sizes[-1])

        # Annual savings estimate (assuming 0.12 EUR/kVArh penalty, 4000h/yr)
        annual_savings = q_required * 0.12 * 4000 / 1000  # rough estimate

        return jsonify({
            "status": "success",
            "results": {
                "q_before_kvar": round(q_before, 2),
                "q_after_kvar": round(q_after, 2),
                "q_required_kvar": round(q_required, 2),
                "selected_kvar": selected_kvar,
                "kva_before": round(kva_before, 2),
                "kva_after": round(kva_after, 2),
                "current_before_a": round(current_before, 2),
                "current_after_a": round(current_after, 2),
                "current_reduction_pct": round((1 - current_after / current_before) * 100, 1) if current_before > 0 else 0,
                "annual_savings_eur": round(annual_savings, 0)
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 400


# ─── 6. Lighting Calculator ──────────────────────────────────────────
@app.route('/calculate-lighting', methods=['POST'])
def calculate_lighting():
    try:
        data = request.get_json()
        room_length = float(data.get('room_length', 10))
        room_width = float(data.get('room_width', 8))
        room_height = float(data.get('room_height', 3))
        work_plane = float(data.get('work_plane', 0.85))
        target_lux = float(data.get('target_lux', 500))
        luminaire_lm = float(data.get('luminaire_lm', 3600))
        luminaire_w = float(data.get('luminaire_w', 36))
        maintenance_factor = float(data.get('maintenance_factor', 0.8))
        room_reflectance = data.get('room_reflectance', 'medium')
        
        area = room_length * room_width
        mounting_height = room_height - work_plane

        # Room Index (RI)
        ri = (room_length * room_width) / (mounting_height * (room_length + room_width))

        # Utilization Factor based on RI and reflectance
        if room_reflectance == 'high':
            base_uf = 0.55
        elif room_reflectance == 'low':
            base_uf = 0.35
        else:
            base_uf = 0.45

        # Adjust UF based on Room Index
        if ri < 1:
            uf = base_uf * 0.7
        elif ri < 2:
            uf = base_uf * 0.85
        elif ri < 3:
            uf = base_uf * 0.95
        else:
            uf = base_uf * 1.0

        # Number of luminaires: N = (E × A) / (F × UF × MF)
        total_lm_required = (target_lux * area) / (uf * maintenance_factor)
        num_luminaires = total_lm_required / luminaire_lm
        
        import math
        num_luminaires_rounded = math.ceil(num_luminaires)

        # Actual lux achieved
        actual_lux = (num_luminaires_rounded * luminaire_lm * uf * maintenance_factor) / area

        # Power density
        total_power = num_luminaires_rounded * luminaire_w
        power_density = total_power / area  # W/m²

        # Suggested layout (rows × columns)
        ratio = room_length / room_width
        cols = math.ceil(math.sqrt(num_luminaires_rounded / ratio))
        rows = math.ceil(num_luminaires_rounded / cols) if cols > 0 else 1

        return jsonify({
            "status": "success",
            "results": {
                "area_m2": round(area, 2),
                "room_index": round(ri, 2),
                "utilization_factor": round(uf, 3),
                "num_luminaires": num_luminaires_rounded,
                "actual_lux": round(actual_lux, 0),
                "total_power_w": total_power,
                "power_density_wm2": round(power_density, 2),
                "layout_rows": rows,
                "layout_cols": cols,
                "total_lm_required": round(total_lm_required, 0)
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 400


# ─── 7. Grounding Resistance ─────────────────────────────────────────
@app.route('/calculate-grounding', methods=['POST'])
def calculate_grounding():
    try:
        data = request.get_json()
        soil_resistivity = float(data.get('soil_resistivity', 100))  # ohm-m
        rod_length = float(data.get('rod_length', 3))  # meters
        rod_diameter = float(data.get('rod_diameter', 0.016))  # meters (16mm)
        target_resistance = float(data.get('target_resistance', 10))  # ohms
        num_rods = int(data.get('num_rods', 1))
        rod_spacing = float(data.get('rod_spacing', 3))  # meters

        import math

        # Single rod resistance: R = (ρ / 2πL) × ln(4L/d)
        single_rod_r = (soil_resistivity / (2 * math.pi * rod_length)) * math.log(4 * rod_length / rod_diameter)

        # Multiple rods with coupling factor
        # Spacing/length ratio determines coupling coefficient
        if num_rods > 1:
            sl_ratio = rod_spacing / rod_length
            if sl_ratio >= 2:
                coupling_factor = 0.9
            elif sl_ratio >= 1:
                coupling_factor = 0.75
            else:
                coupling_factor = 0.6
            
            total_resistance = (single_rod_r / num_rods) * (1 / coupling_factor)
        else:
            total_resistance = single_rod_r
            coupling_factor = 1.0

        # How many rods needed to achieve target?
        rods_needed = 1
        while rods_needed <= 50:
            if rods_needed == 1:
                test_r = single_rod_r
            else:
                sr = rod_spacing / rod_length
                if sr >= 2:
                    cf = 0.9
                elif sr >= 1:
                    cf = 0.75
                else:
                    cf = 0.6
                test_r = (single_rod_r / rods_needed) * (1 / cf)
            if test_r <= target_resistance:
                break
            rods_needed += 1

        meets_target = total_resistance <= target_resistance

        return jsonify({
            "status": "success",
            "results": {
                "single_rod_ohm": round(single_rod_r, 2),
                "total_resistance_ohm": round(total_resistance, 2),
                "target_ohm": target_resistance,
                "meets_target": meets_target,
                "rods_needed": rods_needed,
                "coupling_factor": coupling_factor,
                "soil_resistivity": soil_resistivity
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 400


# ─── 8. Electricity Cost Calculator ──────────────────────────────────
@app.route('/calculate-cost', methods=['POST'])
def calculate_cost():
    try:
        data = request.get_json()
        load_kw = float(data.get('load_kw', 0))
        hours_per_day = float(data.get('hours_per_day', 8))
        days_per_month = float(data.get('days_per_month', 22))
        price_kwh = float(data.get('price_kwh', 0.22))  # EUR/kWh
        demand_charge = float(data.get('demand_charge', 0))  # EUR/kW/month
        power_factor = float(data.get('power_factor', 0.9))
        efficiency = float(data.get('efficiency', 100)) / 100

        actual_consumption_kw = load_kw / efficiency if efficiency > 0 else load_kw

        # Monthly calculations
        daily_kwh = actual_consumption_kw * hours_per_day
        monthly_kwh = daily_kwh * days_per_month
        yearly_kwh = monthly_kwh * 12

        # Costs
        monthly_energy_cost = monthly_kwh * price_kwh
        monthly_demand_cost = actual_consumption_kw * demand_charge
        monthly_total = monthly_energy_cost + monthly_demand_cost
        yearly_total = monthly_total * 12

        # Apparent power
        kva = actual_consumption_kw / power_factor

        # CO2 estimate (0.4 kg CO2/kWh European average)
        co2_monthly_kg = monthly_kwh * 0.4
        co2_yearly_t = (co2_monthly_kg * 12) / 1000

        return jsonify({
            "status": "success",
            "results": {
                "daily_kwh": round(daily_kwh, 2),
                "monthly_kwh": round(monthly_kwh, 2),
                "yearly_kwh": round(yearly_kwh, 2),
                "monthly_energy_eur": round(monthly_energy_cost, 2),
                "monthly_demand_eur": round(monthly_demand_cost, 2),
                "monthly_total_eur": round(monthly_total, 2),
                "yearly_total_eur": round(yearly_total, 2),
                "apparent_power_kva": round(kva, 2),
                "co2_yearly_t": round(co2_yearly_t, 2)
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 400


# ─── 9. Motor Starting Calculator ────────────────────────────────────
@app.route('/calculate-motor', methods=['POST'])
def calculate_motor():
    try:
        data = request.get_json()
        motor_kw = float(data.get('motor_kw', 0))
        voltage = float(data.get('voltage', 400))
        efficiency = float(data.get('efficiency', 90)) / 100
        power_factor = float(data.get('power_factor', 0.85))
        starting_method = data.get('starting_method', 'DOL')
        poles = int(data.get('poles', 4))

        import math

        # Full load current
        fla = (motor_kw * 1000) / (1.732 * voltage * efficiency * power_factor)

        # Locked Rotor Current (typically 6-8x FLA)
        lrc_multiplier = 7  # typical
        lrc = fla * lrc_multiplier

        # Starting current based on method
        if starting_method == 'DOL':
            starting_current = lrc
            starting_torque_pct = 100  # % of full LRC torque
            method_name = "Direct On-Line (DOL)"
        elif starting_method == 'Star-Delta':
            starting_current = lrc / 3
            starting_torque_pct = 33
            method_name = "Star-Delta (Y-Δ)"
        elif starting_method == 'Soft-Starter':
            starting_current = lrc * 0.4  # at 65% voltage
            starting_torque_pct = 42
            method_name = "Soft Starter"
        elif starting_method == 'VFD':
            starting_current = fla * 1.5
            starting_torque_pct = 150
            method_name = "Variable Frequency Drive"
        else:
            starting_current = lrc
            starting_torque_pct = 100
            method_name = "Direct On-Line (DOL)"

        # Synchronous speed
        frequency = 50  # Hz
        sync_rpm = (120 * frequency) / poles
        # Approximate full-load RPM (3-5% slip)
        full_load_rpm = sync_rpm * 0.97

        # Cable sizing (approximate)
        cable_sizes = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240]
        cable_capacities = [19.5, 27, 36, 46, 65, 87, 114, 141, 182, 234, 284, 330, 381, 436, 515]
        
        cable_mm2 = cable_sizes[-1]
        for i, cap in enumerate(cable_capacities):
            if cap >= fla * 1.25:  # 125% of FLA
                cable_mm2 = cable_sizes[i]
                break

        # Circuit breaker (motor-rated)
        cb_sizes = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630]
        circuit_breaker = next((cb for cb in cb_sizes if cb >= fla * 1.25), cb_sizes[-1])

        # Contactor size
        contactor_sizes = [9, 12, 18, 25, 32, 40, 50, 65, 80, 95, 115, 150, 185, 225, 265, 330, 400, 500, 630]
        contactor = next((c for c in contactor_sizes if c >= fla), contactor_sizes[-1])

        # Overload relay range
        overload_min = fla * 0.9
        overload_max = fla * 1.1

        return jsonify({
            "status": "success",
            "results": {
                "fla": round(fla, 2),
                "lrc": round(lrc, 2),
                "starting_current": round(starting_current, 2),
                "starting_method": method_name,
                "starting_torque_pct": starting_torque_pct,
                "sync_rpm": int(sync_rpm),
                "full_load_rpm": int(full_load_rpm),
                "cable_mm2": cable_mm2,
                "circuit_breaker_a": circuit_breaker,
                "contactor_a": contactor,
                "overload_min": round(overload_min, 1),
                "overload_max": round(overload_max, 1)
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True, port=8000, host="0.0.0.0")

