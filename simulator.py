import json
import random
import time
import urllib.request


API_URL = "http://127.0.0.1:8000/api/sensor-data"


def generate_sensor_data():
    """
    Generate simulated readings from the five
    sensors that Aegis H2O will use.
    """

    return {
        "ph": round(random.uniform(6.5, 8.5), 2),
        "tds_mgl": round(random.uniform(100, 800), 2),
        "flow_lpm": round(random.uniform(50, 500), 2),
        "turbidity_ntu": round(random.uniform(1, 10), 2),
        "photodiode_mv": round(random.uniform(500, 2500), 2)
    }


def send_to_api(sensor_data):
    """
    Send sensor readings to the Aegis H2O API.
    """

    data = json.dumps(sensor_data).encode("utf-8")

    request = urllib.request.Request(
        API_URL,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(request) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result

    except Exception as e:
        print("API connection error:", e)
        return None


print("Aegis H2O Sensor Simulator Started")
print("Sending simulated readings every 2 seconds...")
print("-" * 60)


while True:

    sensor_data = generate_sensor_data()

    result = send_to_api(sensor_data)

    if result:

        prediction = result["prediction"]

        print(
            f"pH: {sensor_data['ph']:.2f} | "
            f"TDS: {sensor_data['tds_mgl']:.2f} | "
            f"Flow: {sensor_data['flow_lpm']:.2f} | "
            f"Turbidity: {sensor_data['turbidity_ntu']:.2f} | "
            f"Photodiode: {sensor_data['photodiode_mv']:.2f}"
        )

        print(
            f"Water Health: {prediction['water_health']} | "
            f"Filter Status: {prediction['filter_status']}"
        )

        print("-" * 60)

    time.sleep(2)