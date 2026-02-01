from flask import Flask, jsonify, request
from flask_cors import CORS
from fpdf import FPDF
import os

app = Flask(__name__)
CORS(app)

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

if __name__ == "__main__":
    app.run(debug=True, port=8000, host="0.0.0.0")

