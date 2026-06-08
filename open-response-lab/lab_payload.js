window.OPEN_RESPONSE_LAB_PAYLOAD = {
  "lab_contract": "private_open_response_lab_runtime_mvp",
  "activation_status": "inactive",
  "storage_key": "wset_open_response_lab_private_v1",
  "session_options": {
    "short": 3,
    "standard": 5,
    "long": 10
  },
  "sessions": {
    "short": {
      "session_size": 3,
      "item_ids": [
        "open_response_798",
        "open_response_799",
        "open_response_800"
      ],
      "source_question_ids": [
        "798",
        "799",
        "800"
      ]
    },
    "standard": {
      "session_size": 5,
      "item_ids": [
        "open_response_798",
        "open_response_799",
        "open_response_800",
        "open_response_801",
        "open_response_802"
      ],
      "source_question_ids": [
        "798",
        "799",
        "800",
        "801",
        "802"
      ]
    },
    "long": {
      "session_size": 10,
      "item_ids": [
        "open_response_798",
        "open_response_799",
        "open_response_800",
        "open_response_801",
        "open_response_802",
        "open_response_803",
        "open_response_804",
        "open_response_805",
        "open_response_806",
        "open_response_808"
      ],
      "source_question_ids": [
        "798",
        "799",
        "800",
        "801",
        "802",
        "803",
        "804",
        "805",
        "806",
        "808"
      ]
    }
  },
  "items": [
    {
      "item_id": "open_response_798",
      "source_question_id": "798",
      "stem": "Explique cómo prácticas sostenibles certificadas u orgánicas pueden aumentar los costes de producción y contribuir a la diferenciación comercial del vino.",
      "topic": "sostenibilidad",
      "RA": "RA1"
    },
    {
      "item_id": "open_response_799",
      "source_question_id": "799",
      "stem": "Justifica el uso de la fermentación maloláctica en la producción de ciertos estilos de vino blanco y cómo contribuye a la calidad final.",
      "topic": "fermentación maloláctica",
      "RA": "RA1"
    },
    {
      "item_id": "open_response_800",
      "source_question_id": "800",
      "stem": "Explica cómo la altitud puede influir en el estilo de un vino tinto.",
      "topic": "altitud",
      "RA": "RA1"
    },
    {
      "item_id": "open_response_801",
      "source_question_id": "801",
      "stem": "Explique cómo la orientación y la pendiente del viñedo pueden afectar la maduración de la uva.",
      "topic": "orientación",
      "RA": "RA1"
    },
    {
      "item_id": "open_response_802",
      "source_question_id": "802",
      "stem": "Describa cómo las prácticas de manejo en la bodega pueden reducir el riesgo de oxidación en vinos blancos.",
      "topic": "oxidación",
      "RA": "RA1"
    },
    {
      "item_id": "open_response_803",
      "source_question_id": "803",
      "stem": "Explique la influencia de la elección de levaduras en el perfil sensorial del vino.",
      "topic": "levaduras",
      "RA": "RA1"
    },
    {
      "item_id": "open_response_804",
      "source_question_id": "804",
      "stem": "Explique cómo el drenaje del suelo puede influir en el vigor de la vid y en el estilo del vino.",
      "topic": "suelo",
      "RA": "RA1"
    },
    {
      "item_id": "open_response_805",
      "source_question_id": "805",
      "stem": "Compare cómo la elección de roble americano o francés puede afectar los aromas, el tanino y la integración del roble en vinos tintos.",
      "topic": "roble",
      "RA": "RA1"
    },
    {
      "item_id": "open_response_806",
      "source_question_id": "806",
      "stem": "Describa dos técnicas de manejo del dosel (canopy management) y sus beneficios.",
      "topic": "manejo del dosel",
      "RA": "RA1"
    },
    {
      "item_id": "open_response_808",
      "source_question_id": "808",
      "stem": "Explica por qué la densidad de plantación es un factor clave en la gestión del viñedo y cómo afecta el estilo y costo del vino producido.",
      "topic": "densidad de plantación",
      "RA": "RA1"
    }
  ],
  "evaluation_by_item_id": {
    "open_response_798": {
      "item_id": "open_response_798",
      "source_question_id": "798",
      "expected_concepts": [
        "sostenibilidad",
        "sostenible",
        "certificación",
        "orgánico",
        "biodinámico",
        "coste",
        "costo",
        "precio",
        "mano de obra",
        "rendimiento",
        "diferenciación",
        "percepción",
        "consumidor",
        "mercado",
        "RA1",
        "coste de producción",
        "diferenciación comercial"
      ],
      "optional_causal_chain": "sostenibilidad -> coste -> precio",
      "governance_flags": {
        "safe_for_examiner": false,
        "examiner_scoring_allowed": false,
        "official_wset_question": false,
        "training_item_only": true,
        "uses_llm": false,
        "uses_api": false,
        "uses_embeddings": false,
        "uses_vector_db": false,
        "cloud_services_active": false,
        "public_frontend_active": false,
        "open_response_lab_active": false
      }
    },
    "open_response_799": {
      "item_id": "open_response_799",
      "source_question_id": "799",
      "expected_concepts": [
        "fermentación maloláctica",
        "maloláctica",
        "ácido málico",
        "ácido láctico",
        "acidez",
        "suave",
        "suaviza",
        "textura",
        "cremosa",
        "cremosidad",
        "diacetilo",
        "mantequilla",
        "láctico",
        "cuerpo",
        "complejidad",
        "calidad",
        "estilo",
        "RA1",
        "vino blanco"
      ],
      "optional_causal_chain": "maloláctica -> acidez -> textura",
      "governance_flags": {
        "safe_for_examiner": false,
        "examiner_scoring_allowed": false,
        "official_wset_question": false,
        "training_item_only": true,
        "uses_llm": false,
        "uses_api": false,
        "uses_embeddings": false,
        "uses_vector_db": false,
        "cloud_services_active": false,
        "public_frontend_active": false,
        "open_response_lab_active": false
      }
    },
    "open_response_800": {
      "item_id": "open_response_800",
      "source_question_id": "800",
      "expected_concepts": [
        "altitud",
        "altura",
        "temperatura",
        "frío",
        "fresco",
        "rango diurno",
        "oscilación térmica",
        "maduración",
        "madura",
        "lenta",
        "despacio",
        "acidez",
        "azúcar",
        "alcohol",
        "estilo",
        "frescura",
        "RA1",
        "clima",
        "estilo de vino tinto"
      ],
      "optional_causal_chain": "altitud -> temperatura -> maduración",
      "governance_flags": {
        "safe_for_examiner": false,
        "examiner_scoring_allowed": false,
        "official_wset_question": false,
        "training_item_only": true,
        "uses_llm": false,
        "uses_api": false,
        "uses_embeddings": false,
        "uses_vector_db": false,
        "cloud_services_active": false,
        "public_frontend_active": false,
        "open_response_lab_active": false
      }
    },
    "open_response_801": {
      "item_id": "open_response_801",
      "source_question_id": "801",
      "expected_concepts": [
        "orientación",
        "pendiente",
        "ladera",
        "exposición",
        "sol",
        "solar",
        "insolación",
        "drenaje",
        "agua",
        "maduración",
        "madura",
        "azúcar",
        "acidez",
        "sombra",
        "temperatura",
        "RA1",
        "exposición solar"
      ],
      "optional_causal_chain": "orientación -> exposición -> maduración",
      "governance_flags": {
        "safe_for_examiner": false,
        "examiner_scoring_allowed": false,
        "official_wset_question": false,
        "training_item_only": true,
        "uses_llm": false,
        "uses_api": false,
        "uses_embeddings": false,
        "uses_vector_db": false,
        "cloud_services_active": false,
        "public_frontend_active": false,
        "open_response_lab_active": false
      }
    },
    "open_response_802": {
      "item_id": "open_response_802",
      "source_question_id": "802",
      "expected_concepts": [
        "oxidación",
        "oxígeno",
        "proteger",
        "protección",
        "sulfuroso",
        "SO2",
        "inerte",
        "gas inerte",
        "temperatura",
        "frío",
        "prensado",
        "depósito",
        "aromas",
        "fruta",
        "frescura",
        "color",
        "pardeamiento",
        "RA1",
        "vino blanco",
        "bodega",
        "manejo del oxígeno"
      ],
      "optional_causal_chain": "oxígeno -> oxidación -> aromas",
      "governance_flags": {
        "safe_for_examiner": false,
        "examiner_scoring_allowed": false,
        "official_wset_question": false,
        "training_item_only": true,
        "uses_llm": false,
        "uses_api": false,
        "uses_embeddings": false,
        "uses_vector_db": false,
        "cloud_services_active": false,
        "public_frontend_active": false,
        "open_response_lab_active": false
      }
    },
    "open_response_803": {
      "item_id": "open_response_803",
      "source_question_id": "803",
      "expected_concepts": [
        "levadura",
        "levaduras",
        "fermentación",
        "aromas",
        "ésteres",
        "perfil sensorial",
        "sensorial",
        "levadura seleccionada",
        "seleccionada",
        "control",
        "predecible",
        "estilo",
        "fruta",
        "compuestos aromáticos",
        "RA1"
      ],
      "optional_causal_chain": "levadura -> fermentación -> aromas",
      "governance_flags": {
        "safe_for_examiner": false,
        "examiner_scoring_allowed": false,
        "official_wset_question": false,
        "training_item_only": true,
        "uses_llm": false,
        "uses_api": false,
        "uses_embeddings": false,
        "uses_vector_db": false,
        "cloud_services_active": false,
        "public_frontend_active": false,
        "open_response_lab_active": false
      }
    },
    "open_response_804": {
      "item_id": "open_response_804",
      "source_question_id": "804",
      "expected_concepts": [
        "suelo",
        "drenaje",
        "agua",
        "retención",
        "vigor",
        "raíces",
        "rendimiento",
        "concentración",
        "maduración",
        "estilo",
        "RA1"
      ],
      "optional_causal_chain": "suelo -> drenaje -> vigor",
      "governance_flags": {
        "safe_for_examiner": false,
        "examiner_scoring_allowed": false,
        "official_wset_question": false,
        "training_item_only": true,
        "uses_llm": false,
        "uses_api": false,
        "uses_embeddings": false,
        "uses_vector_db": false,
        "cloud_services_active": false,
        "public_frontend_active": false,
        "open_response_lab_active": false
      }
    },
    "open_response_805": {
      "item_id": "open_response_805",
      "source_question_id": "805",
      "expected_concepts": [
        "roble",
        "americano",
        "francés",
        "vainilla",
        "coco",
        "dulce",
        "especias",
        "cedro",
        "tostado",
        "tanino",
        "integración",
        "perfil sensorial",
        "estructura",
        "complejidad",
        "nuevo",
        "RA1",
        "roble americano",
        "roble francés"
      ],
      "optional_causal_chain": "roble americano -> vainilla -> perfil",
      "governance_flags": {
        "safe_for_examiner": false,
        "examiner_scoring_allowed": false,
        "official_wset_question": false,
        "training_item_only": true,
        "uses_llm": false,
        "uses_api": false,
        "uses_embeddings": false,
        "uses_vector_db": false,
        "cloud_services_active": false,
        "public_frontend_active": false,
        "open_response_lab_active": false
      }
    },
    "open_response_806": {
      "item_id": "open_response_806",
      "source_question_id": "806",
      "expected_concepts": [
        "manejo del dosel",
        "dosel",
        "canopy",
        "deshojado",
        "hojas",
        "posicionamiento de brotes",
        "brotes",
        "exposición",
        "sol",
        "maduración",
        "aireación",
        "circulación de aire",
        "enfermedad",
        "hongos",
        "sombra",
        "racimos",
        "RA1",
        "técnicas de viñedo",
        "sanidad de la uva"
      ],
      "optional_causal_chain": "deshojado -> exposición -> maduración",
      "governance_flags": {
        "safe_for_examiner": false,
        "examiner_scoring_allowed": false,
        "official_wset_question": false,
        "training_item_only": true,
        "uses_llm": false,
        "uses_api": false,
        "uses_embeddings": false,
        "uses_vector_db": false,
        "cloud_services_active": false,
        "public_frontend_active": false,
        "open_response_lab_active": false
      }
    },
    "open_response_808": {
      "item_id": "open_response_808",
      "source_question_id": "808",
      "expected_concepts": [
        "densidad de plantación",
        "densidad",
        "plantación",
        "competencia",
        "vigor",
        "rendimiento",
        "producción",
        "cosecha",
        "concentración",
        "uva",
        "estilo",
        "coste",
        "costo",
        "mano de obra",
        "mecanización",
        "precio",
        "RA1"
      ],
      "optional_causal_chain": "densidad -> competencia -> vigor",
      "governance_flags": {
        "safe_for_examiner": false,
        "examiner_scoring_allowed": false,
        "official_wset_question": false,
        "training_item_only": true,
        "uses_llm": false,
        "uses_api": false,
        "uses_embeddings": false,
        "uses_vector_db": false,
        "cloud_services_active": false,
        "public_frontend_active": false,
        "open_response_lab_active": false
      }
    }
  },
  "feedback_fields": {
    "present_concepts": "concepts_detected",
    "missing_concepts": "concepts_absent",
    "causal_link_feedback": "missing_causal_reasoning",
    "revision_suggestion": "improvement_suggestions"
  },
  "feedback_prohibited": [
    "mark",
    "score",
    "percentage",
    "pass_fail",
    "wset_equivalence",
    "examiner_judgement",
    "official_grade"
  ],
  "governance_flags": {
    "safe_for_examiner": false,
    "examiner_scoring_allowed": false,
    "official_wset_question": false,
    "training_item_only": true,
    "uses_llm": false,
    "uses_api": false,
    "uses_embeddings": false,
    "uses_vector_db": false,
    "cloud_services_active": false,
    "public_frontend_active": false,
    "open_response_lab_active": false
  }
};
