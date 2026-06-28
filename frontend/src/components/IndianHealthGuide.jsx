import React, { useState } from "react";

const INDIAN_ALLERGIES = [
  {
    id: "dairy",
    icon: "🥛",
    name: "Lactose Intolerance & Milk Allergy",
    severity: "moderate",
    desc: "Lactose intolerance is the inability to digest milk sugar (lactose), while milk allergy is an immune reaction to dairy proteins. Extremely common in Indian children where milk and ghee are staple ingredients.",
    symptoms: "Abdominal cramps, bloating, diarrhea, gas, skin eczema, vomiting.",
    hiddenSources: [
      "Ghee used in rotis, parathas, and dal tempering",
      "Mawa or Khoya used as a base for Indian sweets (barfi, gulab jamun)",
      "Butter used to toast bread, pav, or makhana (foxnuts)",
      "Yogurt/Dahi used in rich curries (gravies) and tandoori marinades",
      "Paneer (cottage cheese) in vegetarian dishes",
      "Milk powder in commercial biscuits and rusks"
    ],
    meals: {
      breakfast: "Ragi Porridge / Malt made with water & jaggery, or Vegetable Upma cooked in vegetable oil (no ghee).",
      lunch: "Yellow Dal Khichdi (tempered in sunflower oil instead of ghee), or curd-free Kadhi with Steamed Rice.",
      dinner: "Plain Phulka/Roti (without ghee) served with dry potato (aloo bhujia) or okra (bhindi) curry.",
      snacks: "Roasted Makhana seasoned with oil & salt, puffed rice murmura chaat (bhel), or fresh fruit salad."
    },
    hindiTerms: ["Doodh (Milk)", "Dahi / Curd (Yogurt)", "Paneer (Cottage Cheese)", "Ghee (Clarified Butter)", "Makhan (Butter)", "Mawa / Khoya (Condensed Milk)", "Malai (Cream)"]
  },
  {
    id: "gluten",
    icon: "🌾",
    name: "Wheat Allergy & Celiac Disease",
    severity: "high",
    desc: "Celiac disease is an autoimmune condition triggered by gluten, whereas wheat allergy is an allergic reaction to wheat proteins. Highly critical in North Indian diets where wheat rotis are daily staples.",
    symptoms: "Chronic bloating, failure to thrive (stunted growth), poor appetite, abdominal pain, diarrhea.",
    hiddenSources: [
      "Suji or Rawa (Semolina) used in upma, halwa, and idli batters",
      "Maida (Refined Flour) in parathas, pooris, naans, samosas, and biscuits",
      "Asafoetida (Hing) - commercial hing powder is often blended with wheat/maida flour",
      "Dalia (Broken Wheat) porridge",
      "Soy sauce in Indo-Chinese street food (contains wheat)"
    ],
    meals: {
      breakfast: "Rice Poha with vegetables, Sabudana Khichdi (tapioca pearls), or Idli/Dosa with coconut chutney.",
      lunch: "Rajma Chawal (kidney bean curry with rice), or Kadhi Chawal (chickpea flour curry with rice - ensure hing-free or gluten-free hing).",
      dinner: "Gluten-free Ragi (finger millet) or Jowar (sorghum) Roti served with yellow dal and vegetable subji.",
      snacks: "Roasted foxnuts (makhana), rice flakes murmura bhel (check spices), or banana/potato chips."
    },
    hindiTerms: ["Gehun (Wheat)", "Maida (Refined Flour)", "Suji / Rawa (Semolina)", "Aata (Flour)", "Dalia (Broken Wheat)", "Hing (Asafoetida - check labels for wheat blend)"]
  },
  {
    id: "legumes",
    icon: "🍛",
    name: "Legume & Lentil (Dal) Allergy",
    severity: "moderate",
    desc: "Allergy to lentils (dals), chickpeas, and other beans. Legumes are the primary protein source in Indian vegetarian diets, meaning children with this allergy require creative alternatives like seeds or safe dairy to avoid protein deficiency.",
    symptoms: "Hives, swelling of lips/tongue, vomiting, gas, wheezing.",
    hiddenSources: [
      "Besan (Gram Flour) used as a thickener in gravies, pakoras, or kadhi",
      "Papadums/Papad (typically made of black gram/urad dal or moong dal)",
      "Sambar and Rasam (traditionally made with pigeon pea/toor dal)",
      "Khaman Dhokla (steamed snack made from chickpea flour)",
      "Peanuts (which are taxonomically legumes and share cross-reactive proteins)"
    ],
    meals: {
      breakfast: "Oats porridge with milk/honey, Paneer Bhurji with toast, or Wheat Rawa Upma (without peanuts/lentils).",
      lunch: "Curd Rice (Thayir Sadam) tempered with cumin/curry leaves, or Paneer Butter Masala with Roti.",
      dinner: "Roti served with dry potato, pumpkin (kaddu), or bottle gourd (lauki) sabji.",
      snacks: "Roasted sunflower seeds, fresh fruit yogurt, or boiled sweet corn with lime."
    },
    hindiTerms: ["Dal / Pullses (Lentils)", "Chana / Chole (Chickpeas)", "Besan (Gram Flour)", "Rajma (Kidney Beans)", "Lobiya (Black-eyed Peas)", "Moong / Urad / Toor"]
  },
  {
    id: "eggs",
    icon: "🥚",
    name: "Egg & Poultry Allergy",
    severity: "moderate",
    desc: "Immune reaction to proteins found in egg whites or yolks. Eggs are increasingly used in early childhood nutrition in India, but are also hidden in bakery items.",
    symptoms: "Rashes, hives, nasal congestion, vomiting, digestive distress.",
    hiddenSources: [
      "Naan bread (dough is often kneaded with egg for softness and rise)",
      "Bakery cakes, pastries, biscuits, and muffins from local bakers",
      "Mayonnaise in sandwiches, wraps, and burger spreads",
      "Egg wash used to glaze puff pastries and samosas at local snack shops"
    ],
    meals: {
      breakfast: "Vegetable Poha, Besan Chilla (savory chickpea pancake), or Paneer Sandwich.",
      lunch: "Vegetable Pulav with raita, eggless pasta in tomato sauce, or Dal-Chawal with vegetable fry.",
      dinner: "Wheat Roti with paneer curry and dry mixed vegetables.",
      snacks: "Dhokla (steamed chickpea snack), home-baked eggless cookies, or roasted makhana."
    },
    hindiTerms: ["Anda (Egg)", "Mayonnaise", "Cake / Pastry"]
  },
  {
    id: "peanuts",
    icon: "🥜",
    name: "Peanut & Tree Nut Allergy",
    severity: "high",
    desc: "Severe, potentially life-threatening allergy to peanuts and tree nuts (cashews, almonds, walnuts). Rich cashews and almonds are widely used in Indian desserts and premium Mughlai gravies.",
    symptoms: "Anaphylaxis, hives, swelling, throat tightness, severe wheezing, drop in blood pressure.",
    hiddenSources: [
      "Kaju (Cashew) paste used to thicken restaurant gravies (Shahi Paneer, Korma)",
      "Badam (Almond) powder/paste in milkshakes, kheer, and halwas",
      "Peanuts sprinkled on Upma, Poha, or mixed into Sabudana Khichdi",
      "Traditional sweets like Kaju Katli, badam barfi, or dry-fruit laddus",
      "Chutneys (coconut or tomato chutneys sometimes blended with peanuts for thickness)"
    ],
    meals: {
      breakfast: "Plain Upma (strictly peanut-free), Idli/Dosa with tomato-coconut chutney (verify no nut cross-contamination).",
      lunch: "Yellow Dal Tadka with plain Rice, or Dry Vegetable sabji (potato/cauliflower) cooked without nut paste.",
      dinner: "Plain Roti with Chole (chickpea curry - using onion-tomato gravy without cashews).",
      snacks: "Roasted chickpea (chana), puffed rice bhel (ensure no peanuts), or fresh fruit slices."
    },
    hindiTerms: ["Moongfali (Peanut)", "Kaju (Cashew)", "Badam (Almond)", "Akhrot (Walnut)", "Pista (Pistachio)", "Mawa / Dry Fruits"]
  },
  {
    id: "mustard",
    icon: "🟡",
    name: "Mustard Allergy (Sarson)",
    severity: "high",
    desc: "Allergy to mustard seed proteins. Mustard seeds (Rai) are a primary tempering element in South Indian cooking, and mustard oil (Sarson ka tel) is the standard cooking medium in Bengali and North Indian households.",
    symptoms: "Contact dermatitis, hives, throat swelling, vomiting, breathing issues.",
    hiddenSources: [
      "Pickles (Achar) which are heavily spiced and preserved using mustard powder/oil",
      "Tadka/Tempering on dals, Sambars, and dry vegetable curries (uses black mustard seeds)",
      "Sarson ka Saag (traditional Punjabi mustard greens curry)",
      "Kasundi (fermented Bengali mustard dipping sauce)",
      "Curry powders and pre-packed spice blends"
    ],
    meals: {
      breakfast: "Upma or Poha tempered strictly with cumin seeds and curry leaves in coconut/sunflower oil.",
      lunch: "Fish or Chicken curry prepared in sunflower/soybean oil (no mustard oil/seeds).",
      dinner: "Khichdi tempered with ghee/oil and cumin seeds, served with a dry potato subji (no mustard seeds).",
      snacks: "Popcorn (salted), steamed sweet corn with lime and salt, or roasted foxnuts."
    },
    hindiTerms: ["Sarson (Mustard)", "Rai / Sarso (Mustard Seeds)", "Sarson ka Tel (Mustard Oil)", "Achar (Pickle)", "Kasundi"]
  }
];

const PRESET_RECIPES = [
  {
    name: "Dal Tadka & Ghee Rice",
    ingredients: "rice, split yellow lentils, turmeric, salt, ghee, cumin seeds, red chilli, hing",
    description: "Traditional lentils tempered with ghee, served with ghee-flavored rice.",
    triggers: {
      dairy: "ghee",
      legumes: "lentils"
    },
    modifications: {
      dairy: "Substitute ghee with sunflower or coconut oil to make it completely Dairy-Free.",
      legumes: "Replace lentils with diced vegetables or potatoes cooked in a spiced cumin broth (Alloo Rasdar) to serve with rice."
    }
  },
  {
    name: "Suji Ka Halwa",
    ingredients: "semolina, wheat, sugar, ghee, cardamom, cashews, almonds, raisins, water",
    description: "Sweet semolina pudding cooked in ghee and garnished with dry fruits.",
    triggers: {
      gluten: "semolina, wheat",
      dairy: "ghee",
      peanuts: "cashews, almonds"
    },
    modifications: {
      gluten: "Use roasted coarse Ragi (Finger Millet) flour or amaranth flour instead of semolina.",
      dairy: "Cook the halwa in refined coconut oil or vegetable oil instead of ghee.",
      peanuts: "Skip cashews and almonds; garnish with melon seeds, pumpkin seeds, or raisins instead."
    }
  },
  {
    name: "Vegetable Upma with Tadka",
    ingredients: "semolina, wheat, sunflower oil, mustard seeds, curry leaves, ginger, peanuts, carrots, peas, salt",
    description: "Savoury semolina porridge tempered with mustard seeds and crunchy peanuts.",
    triggers: {
      gluten: "semolina, wheat",
      mustard: "mustard seeds",
      peanuts: "peanuts"
    },
    modifications: {
      gluten: "Use gluten-free rolled oats or broken maize (corn grits) to make the upma.",
      mustard: "Temper the dish with cumin seeds (jeera) instead of mustard seeds.",
      peanuts: "Omit peanuts entirely; substitute with roasted cashew nuts (if nut safe) or roasted chana dal/sunflower seeds for crunch."
    }
  },
  {
    name: "Besan Chilla",
    ingredients: "gram flour, chickpea, onion, green chilli, coriander, turmeric, salt, oil, hing",
    description: "Savory pancake made from spiced chickpea flour (besan).",
    triggers: {
      legumes: "gram flour, chickpea"
    },
    modifications: {
      legumes: "Replace chickpea flour with Rice flour or Oats flour to make a safe savory pancake."
    }
  },
  {
    name: "Paneer Makhani",
    ingredients: "paneer, cottage cheese, milk, butter, cream, tomatoes, ginger, cashews, almonds, sugar, salt",
    description: "Paneer cubes cooked in a rich, creamy tomato gravy thickened with nut pastes.",
    triggers: {
      dairy: "paneer, cottage cheese, milk, butter, cream",
      peanuts: "cashews, almonds"
    },
    modifications: {
      dairy: "Replace paneer with firm Tofu, and use coconut milk and vegetable oil instead of butter, dairy cream, and milk.",
      peanuts: "Thicken the gravy using poppy seed (postodana) paste or melon seeds (magaz) instead of cashew/almond paste."
    }
  },
  {
    name: "Bengali Shorshe Maach",
    ingredients: "fish, turmeric, salt, mustard oil, mustard seeds, green chillies, water",
    description: "Fish steaks simmered in a sharp, pungent mustard paste and mustard oil sauce.",
    triggers: {
      mustard: "mustard oil, mustard seeds"
    },
    modifications: {
      mustard: "Cook the fish in soybean or sunflower oil, using a gravy made from yogurt (if dairy safe) or poppy seeds instead of mustard paste."
    }
  }
];

export default function IndianHealthGuide() {
  const [activeAllergy, setActiveAllergy] = useState(INDIAN_ALLERGIES[0].id);
  const [selectedPresetRecipe, setSelectedPresetRecipe] = useState("");
  const [customIngredients, setCustomIngredients] = useState("");
  const [checkerAllergies, setCheckerAllergies] = useState([]);
  const [checkerResult, setCheckerResult] = useState(null);

  const activeData = INDIAN_ALLERGIES.find((a) => a.id === activeAllergy) || INDIAN_ALLERGIES[0];

  const handleToggleCheckerAllergy = (allergyId) => {
    if (checkerAllergies.includes(allergyId)) {
      setCheckerAllergies(checkerAllergies.filter((id) => id !== allergyId));
    } else {
      setCheckerAllergies([...checkerAllergies, allergyId]);
    }
  };

  const handleSelectPreset = (e) => {
    const presetName = e.target.value;
    setSelectedPresetRecipe(presetName);
    const preset = PRESET_RECIPES.find((r) => r.name === presetName);
    if (preset) {
      setCustomIngredients(preset.ingredients);
    } else {
      setCustomIngredients("");
    }
    setCheckerResult(null);
  };

  const runRecipeCheck = () => {
    if (!customIngredients.trim()) {
      setCheckerResult({
        status: "ERROR",
        message: "Please enter ingredients to run the safety check."
      });
      return;
    }
    if (checkerAllergies.length === 0) {
      setCheckerResult({
        status: "SAFE",
        message: "No child allergies selected. Ingredients are technically safe!",
        matches: [],
        mods: []
      });
      return;
    }

    const ingredientsLower = customIngredients.toLowerCase();
    const matchedAllergies = [];
    const modifications = [];

    // Let's check for matches manually based on our preset mapping or keyword matching
    checkerAllergies.forEach((allergyId) => {
      const allergyInfo = INDIAN_ALLERGIES.find((a) => a.id === allergyId);
      if (!allergyInfo) return;

      // We map the allergy ID to keywords
      let keywords = [];
      if (allergyId === "dairy") keywords = ["milk", "cheese", "paneer", "butter", "ghee", "cream", "curd", "yogurt", "mawa", "khoya", "dahi", "malai"];
      else if (allergyId === "gluten") keywords = ["wheat", "semolina", "suji", "rawa", "maida", "hing", "asafoetida", "dalia", "flour", "aata", "gehun"];
      else if (allergyId === "legumes") keywords = ["lentil", "lentils", "dal", "chana", "chickpea", "chickpeas", "besan", "gram flour", "pulses", "peas", "rajma", "urad", "moong", "toor", "papad"];
      else if (allergyId === "eggs") keywords = ["egg", "eggs", "anda", "mayonnaise"];
      else if (allergyId === "peanuts") keywords = ["peanut", "peanuts", "cashew", "cashews", "almond", "almonds", "walnut", "walnuts", "pistachio", "pista", "kaju", "badam", "moongfali"];
      else if (allergyId === "mustard") keywords = ["mustard", "sarson", "rai", "kasundi", "achar"];

      const matches = keywords.filter((word) => ingredientsLower.includes(word));
      if (matches.length > 0) {
        matchedAllergies.push({
          allergyName: allergyInfo.name,
          matchedIngredients: matches
        });

        // Add modification advice if it exists
        const preset = PRESET_RECIPES.find((r) => r.ingredients === customIngredients || (selectedPresetRecipe && r.name === selectedPresetRecipe));
        if (preset && preset.modifications[allergyId]) {
          modifications.push({
            allergyName: allergyInfo.name,
            advice: preset.modifications[allergyId]
          });
        } else {
          // Generic advice
          modifications.push({
            allergyName: allergyInfo.name,
            advice: `Consider substituting ${matches.join(", ")} with allergen-free alternatives.`
          });
        }
      }
    });

    if (matchedAllergies.length > 0) {
      setCheckerResult({
        status: "RESTRICTED",
        message: "RESTRICTED — Allergenic ingredients detected in the recipe!",
        matches: matchedAllergies,
        mods: modifications
      });
    } else {
      setCheckerResult({
        status: "SAFE",
        message: "SAFE — No matching allergens found. This dish is safe to serve!",
        matches: [],
        mods: []
      });
    }
  };

  return (
    <div className="indian-guide-section">
      <div className="indian-guide-header">
        <h1 className="dashboard-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span>🇮🇳</span> Indian Pediatric Health & Meal Safety Guide
        </h1>
        <p className="indian-guide-subtitle">
          An interactive clinical-dietary manual detailing common Indian pediatric health issues, hidden allergen sources, safety meal plans, and terminology.
        </p>
      </div>

      {/* Grid of Allergies */}
      <div className="indian-allergy-grid">
        {INDIAN_ALLERGIES.map((allergy) => (
          <div
            key={allergy.id}
            className={`indian-allergy-card ${activeAllergy === allergy.id ? "active" : ""}`}
            onClick={() => setActiveAllergy(allergy.id)}
          >
            <div className="indian-allergy-card-header">
              <div className="indian-allergy-title-wrapper">
                <span className="indian-allergy-icon">{allergy.icon}</span>
                <span className="indian-allergy-name">{allergy.name}</span>
              </div>
              <span className={`indian-allergy-severity ${allergy.severity}`}>
                {allergy.severity}
              </span>
            </div>
            <p className="indian-allergy-desc">{allergy.desc.substring(0, 110)}...</p>
          </div>
        ))}
      </div>

      {/* Allergy Detailed View Card */}
      {activeData && (
        <div className="indian-guide-detail-card">
          <h2 className="indian-guide-col-title" style={{ fontSize: "1.3rem", borderBottom: "1px solid var(--color-border-light)", paddingBottom: "10px" }}>
            {activeData.icon} Detailed Manual: {activeData.name}
          </h2>

          <div className="indian-guide-detail-grid">
            {/* Column 1: Overview & Hidden Sources */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 className="indian-guide-col-title">🏥 Pediatric Symptoms & Issues</h3>
                <div className="indian-guide-text-box">
                  <p><strong>Primary Symptoms:</strong> {activeData.symptoms}</p>
                  <p style={{ marginTop: "10px" }}>{activeData.desc}</p>
                </div>
              </div>

              <div>
                <h3 className="indian-guide-col-title">🔍 Hidden Sources in Indian Kitchens</h3>
                <div className="indian-guide-text-box" style={{ background: "rgba(239, 68, 68, 0.03)", borderColor: "rgba(239, 68, 68, 0.1)" }}>
                  <ul className="indian-hidden-sources-list">
                    {activeData.hiddenSources.map((source, i) => (
                      <li key={i}>{source}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="indian-guide-col-title">🗣️ Regional / Hindi Terms to Watch</h3>
                <div className="indian-translation-badge-container">
                  {activeData.hindiTerms.map((term, i) => (
                    <span key={i} className="indian-translation-badge">
                      ⚠️ {term}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Safety Meal Plan */}
            <div>
              <h3 className="indian-guide-col-title">🍽️ Clinical Safety Meal Plan</h3>
              <div className="indian-meal-plan-grid">
                <div className="indian-meal-type-box">
                  <div className="indian-meal-type-header">🥞 Breakfast</div>
                  <div className="indian-meal-type-value">{activeData.meals.breakfast}</div>
                </div>
                <div className="indian-meal-type-box">
                  <div className="indian-meal-type-header">🍛 Lunch</div>
                  <div className="indian-meal-type-value">{activeData.meals.lunch}</div>
                </div>
                <div className="indian-meal-type-box">
                  <div className="indian-meal-type-header">🥪 Afternoon Snack</div>
                  <div className="indian-meal-type-value">{activeData.meals.snacks}</div>
                </div>
                <div className="indian-meal-type-box">
                  <div className="indian-meal-type-header">🍲 Dinner</div>
                  <div className="indian-meal-type-value">{activeData.meals.dinner}</div>
                </div>
              </div>

              <div className="indian-guide-text-box" style={{ marginTop: "16px", background: "rgba(20, 184, 166, 0.03)", borderColor: "rgba(20, 184, 166, 0.1)" }}>
                <strong>🩺 Clinical Advice:</strong> Daycare providers and parents must review recipes carefully. Ensure complete isolation of preparation areas and washing of utensils to prevent cross-contamination. Provide training on emergency response and epinephrine administration for high-risk severe allergies.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indian Recipe Safety Checker */}
      <div className="recipe-checker-card">
        <h2 className="indian-guide-col-title" style={{ fontSize: "1.2rem" }}>
          🎛️ Interactive Indian Recipe Safety Checker
        </h2>
        <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "-6px" }}>
          Test standard Indian dishes or enter your own custom ingredients to identify pediatric allergy risks and learn safe cooking modifications.
        </p>

        <div className="recipe-checker-form">
          <div className="form-group">
            <label>Select Preset Indian Dish</label>
            <select value={selectedPresetRecipe} onChange={handleSelectPreset}>
              <option value="">-- Choose a preset recipe --</option>
              {PRESET_RECIPES.map((recipe) => (
                <option key={recipe.name} value={recipe.name}>
                  {recipe.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ gridRow: "span 2" }}>
            <label>Recipe Ingredients (comma-separated)</label>
            <textarea
              value={customIngredients}
              onChange={(e) => {
                setCustomIngredients(e.target.value);
                setSelectedPresetRecipe("");
                setCheckerResult(null);
              }}
              placeholder="e.g. rice, dal, ghee, turmeric, cumin"
              rows={4}
              style={{ resize: "none" }}
            />
          </div>

          <div className="form-group">
            <label style={{ marginBottom: "8px" }}>Select Child's Allergies to Check</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {INDIAN_ALLERGIES.map((allergy) => (
                <button
                  key={allergy.id}
                  type="button"
                  className={`btn ${checkerAllergies.includes(allergy.id) ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => handleToggleCheckerAllergy(allergy.id)}
                  style={{
                    padding: "6px 12px",
                    fontSize: "0.8rem",
                    borderRadius: "20px",
                    margin: 0
                  }}
                >
                  {allergy.icon} {allergy.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={runRecipeCheck}
          style={{ marginTop: "16px", display: "inline-block" }}
        >
          🔍 Run Ingredient Scan
        </button>

        {checkerResult && (
          <div className={`recipe-checker-result ${checkerResult.status.toLowerCase()}`}>
            <div className="recipe-result-title">
              {checkerResult.status === "SAFE" ? "🟢" : checkerResult.status === "ERROR" ? "❌" : "🔴"}{" "}
              {checkerResult.message}
            </div>
            
            {checkerResult.matches && checkerResult.matches.length > 0 && (
              <div className="recipe-result-desc" style={{ marginTop: "10px" }}>
                <strong>Trigger matches:</strong>
                <ul style={{ margin: "5px 0 0 16px", padding: 0 }}>
                  {checkerResult.matches.map((match, i) => (
                    <li key={i}>
                      {match.allergyName}: contains <strong>{match.matchedIngredients.join(", ")}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {checkerResult.mods && checkerResult.mods.length > 0 && (
              <div className="recipe-result-mod">
                <strong>📝 Recommended Safety Modifications:</strong>
                <ul style={{ margin: "5px 0 0 16px", padding: 0, listStyleType: "square" }}>
                  {checkerResult.mods.map((mod, i) => (
                    <li key={i} style={{ marginTop: "4px" }}>
                      <strong>{mod.allergyName}:</strong> {mod.advice}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
