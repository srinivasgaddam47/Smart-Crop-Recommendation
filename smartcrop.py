import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier

# ==========================================
# 1. LOAD DATA
# ==========================================

df = pd.read_csv("final_data.csv")
print("Crop Recommendation System - Data Loaded")

# ==========================================
# 2. CLEAN COLUMN NAMES
# ==========================================

df.columns = df.columns.str.strip().str.lower()
df.columns = df.columns.str.replace(" ", "_")
df = df.loc[:, ~df.columns.duplicated()]

# ==========================================
# 3. HANDLE MISSING VALUES + SOIL FERTILITY
# ==========================================

df = df.ffill()

if "soil_fertility" not in df.columns and "soil_health_score" in df.columns:
    df["soil_fertility"] = pd.cut(
        df["soil_health_score"],
        bins=[0, 40, 70, 100],
        labels=["low", "medium", "high"]
    ).astype(str)

# ==========================================
# 4. ENCODING
# ==========================================

encoders = {}

for col in df.select_dtypes(include=["object", "category"]).columns:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str).str.lower())
    encoders[col] = le

# ==========================================
# 5. FEATURES
# ==========================================

selected_features = [
    "soil_type",
    "location",
    "previous_crop",
    "land_size",
    "season",
    "soil_fertility"
]

available_features = [
    col for col in selected_features
    if col in df.columns
]

X = df[available_features]
y = df["crops"]

# ==========================================
# 6. TRAIN MODEL
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

model = RandomForestClassifier(
    n_estimators=200,
    class_weight="balanced",
    random_state=42
)

model.fit(X_train, y_train)

print("\n Model Trained Successfully!")

# ==========================================
# 7. CROP DURATION MAP
# ==========================================

crop_duration_map = {
    "rice": "medium",
    "wheat": "medium",
    "maize": "medium",
    "tomato": "short",
    "chilli": "short",
    "spinach": "short",
    "onion": "short",
    "potato": "short",
    "ginger": "short",
    "coconut": "long",
    "tea": "long",
    "cashew": "long",
    "sugarcane": "long",
    "pepper": "medium"
}

# ==========================================
# 8. PREPARE INPUT
# ==========================================

def prepare_input(user_input):

    data = {}

    for col in X.columns:

        raw_value = user_input.get(col, "")
        value_str = str(raw_value).strip()

        # Numeric feature
        if col == "land_size":
            try:
                data[col] = float(value_str)
            except:
                data[col] = 3.0
            continue

        value_lower = value_str.lower()

        # Encode categorical values
        if col in encoders:
            try:
                data[col] = encoders[col].transform([value_lower])[0]
            except:
                # Unknown value → first known class
                data[col] = 0
        else:
            try:
                data[col] = float(value_lower)
            except:
                data[col] = 0

    return pd.DataFrame([data])

# ==========================================
# 9. PREDICT FUNCTION
# ==========================================

def predict(user_input):

    sample_df = prepare_input(user_input)

    # Predict probabilities
    probs = model.predict_proba(sample_df)[0]

    crop_suggestions = []

    # Create crop list with confidence
    for idx, prob in enumerate(probs):

        crop_name = encoders["crops"].inverse_transform([idx])[0].title()

        crop_suggestions.append({
            "crop": crop_name,
            "confidence": round(float(prob * 100), 2)
        })

    # ----------------------------------------
    # SORT BY CONFIDENCE (Highest → Lowest)
    # ----------------------------------------

    crop_suggestions.sort(
        key=lambda x: x["confidence"],
        reverse=True
    )

    land_size = float(user_input.get("land_size", 3))

    # ----------------------------------------
    # Filter long-duration crops
    # ----------------------------------------

    filtered = []

    for item in crop_suggestions:

        duration = crop_duration_map.get(
            item["crop"].lower(),
            "medium"
        )

        if land_size <= 5 and duration == "long":
            continue

        filtered.append(item)

    if len(filtered) == 0:
        filtered = crop_suggestions

    # ----------------------------------------
    # SORT AGAIN AFTER FILTERING
    # ----------------------------------------

    filtered.sort(
        key=lambda x: x["confidence"],
        reverse=True
    )

    # Top 3 suggestions
    top_suggestions = filtered[:3]

    best_crop = top_suggestions[0]["crop"]

    # ----------------------------------------
    # Find Intercrop
    # ----------------------------------------

    intercrop = "Not Available"

    try:

        if "inter_crop" in encoders:

            crop_encoded = encoders["crops"].transform(
                [best_crop.lower()]
            )[0]

            inter_data = df[
                df["crops"] == crop_encoded
            ]["inter_crop"]

            if len(inter_data) > 0:

                intercrop_encoded = inter_data.mode()[0]

                intercrop = encoders[
                    "inter_crop"
                ].inverse_transform(
                    [intercrop_encoded]
                )[0].title()

    except:
        pass

    # ----------------------------------------
    # Output Text
    # ----------------------------------------

    suggestion = f""" Smart Crop Recommendation

Best Crop: {best_crop}

Suitable for your soil, location & land size.

Intercropping:
You can grow {intercrop} along with {best_crop}.

Alternative Crops:

1. {top_suggestions[0]['crop']} ({top_suggestions[0]['confidence']}%)

2. {top_suggestions[1]['crop']} ({top_suggestions[1]['confidence']}%)

3. {top_suggestions[2]['crop']} ({top_suggestions[2]['confidence']}%)

Tip:
Consider water availability and current season.
"""

    return {
        "best_crop": best_crop,
        "intercrop": intercrop,
        "top_suggestions": top_suggestions,
        "suggestion": suggestion,
        "land_size_used": land_size
    }

print("\n SmartCrop module loaded successfully for Frontend!")
