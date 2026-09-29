package com.agro.modules.advisory.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agro.modules.advisory.domain.VetConsultation;
import com.agro.modules.advisory.dto.DifferentialDiagnosisDto;
import com.agro.modules.advisory.dto.VetConsultationRequest;
import com.agro.modules.advisory.dto.VetConsultationResponse;
import com.agro.modules.advisory.repository.VetConsultationRepository;
import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.service.FarmService;
import com.agro.modules.lot.domain.Batch;
import com.agro.modules.lot.repository.BatchRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Motor zootécnico y clínico para Consultorio Veterinario Asistido (HU-12).
 * Realiza triaje de signos patológicos, cotejo con base de conocimiento veterinario
 * para peces y cerdos, cálculo de concordancia clínica y generación de protocolos
 * inmediatos de bioseguridad, tratamiento y toma de muestras oficiales.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VetDiagnosisService {

    private final VetConsultationRepository vetConsultationRepository;
    private final FarmService farmService;
    private final BatchRepository batchRepository;
    private final ObjectMapper objectMapper;

    /**
     * Modelo interno de patología en la base de conocimiento veterinario.
     */
    @Getter
    @Builder
    private static class DiseaseProfile {
        private String diseaseName;
        private String pathogen;
        private String productionType; // PISCICULTURA o PORCICULTURA
        private List<String> primaryKeywords;
        private List<String> secondaryKeywords;
        private String urgencyLevel; // CRITICAL, HIGH, MODERATE, LOW
        private String biosecurityProtocol;
        private String treatmentRecommendation;
        private String samplingInstructions;
        private String keyIndicator;
    }

    private static final List<DiseaseProfile> KNOWLEDGE_BASE = initKnowledgeBase();

    private static List<DiseaseProfile> initKnowledgeBase() {
        List<DiseaseProfile> list = new ArrayList<>();

        // =========================================================================
        // 1. PATOLOGÍAS PISCÍCOLAS (TILAPIA, TRUCHA, CACHAMA)
        // =========================================================================
        list.add(DiseaseProfile.builder()
            .diseaseName("Estreptococosis de los Peces")
            .pathogen("Streptococcus agalactiae / Streptococcus iniae")
            .productionType("PISCICULTURA")
            .primaryKeywords(Arrays.asList("espiral", "circulo", "salton", "exoftalmia", "opacidad", "corneal", "ojo nublado", "hemorragia base aleta"))
            .secondaryKeywords(Arrays.asList("boqueo", "letargia", "distension", "vientre hinchado", "hinchazon", "muerte aguda", "anorexia"))
            .urgencyLevel("CRITICAL")
            .keyIndicator("Nado errático en tirabuzón o espiral con exoftalmia severa y opacidad corneal bilateral")
            .biosecurityProtocol("1. Cuarentena estricta inmediata del estanque. Prohibido transvase de peces o drenaje hacia otros estanques.\n"
                + "2. Desinfección integral de redes, salabardos, chinchorros y botas con amonio cuaternario al 1% o yodóforos.\n"
                + "3. Reducir la ración alimenticia al 50% de inmediato para minimizar excreción fecal bacteriana y sobrecarga del filtro.\n"
                + "4. Recolección dos veces al día de ejemplares muertos y descarte sanitario por compostaje profundo o incineración.")
            .treatmentRecommendation("Bajo supervisión médico-veterinaria oficial con antibiograma previo: Florfenicol oral incorporado en el alimento al 10 mg/kg de biomasa viva/día durante 10 días continuos (o Oxitetraciclina a 50-75 mg/kg durante 12 días).\n"
                + "ADVERTENCIA ICA: Cumplir estrictamente el tiempo de retiro mínimo de 21 días previo a la cosecha comercial.")
            .samplingInstructions("Remitir con refrigeración (hielera a 4°C, NUNCA congelar) al laboratorio de diagnóstico ICA: 5 peces vivos o moribundos. Órganos diana estériles: encéfalo, bazo y riñón anterior.")
            .build());

        list.add(DiseaseProfile.builder()
            .diseaseName("Columnariasis / Mancha en Silla de Montar")
            .pathogen("Flavobacterium columnare")
            .productionType("PISCICULTURA")
            .primaryKeywords(Arrays.asList("silla de montar", "blanca", "algodoncillo", "aletas rotas", "deshilachadas", "erosion", "branquia marron", "barro"))
            .secondaryKeywords(Arrays.asList("piel", "ulceras", "manchas", "descamacion", "moribundo", "orilla"))
            .urgencyLevel("HIGH")
            .keyIndicator("Lesiones blanquecinas/amarillentas en piel dorsal simulando silla de montar y necrosis branquial")
            .biosecurityProtocol("1. Aumentar recambio de agua limpia a razón de 20-30% diario para reducir carga orgánica y bacteriana suspendida.\n"
                + "2. No manipular los peces con mallas secas para no lesionar la capa mucosa protectora de la epidermis.\n"
                + "3. Aislar el lote y desinfectar implementos de manejo.")
            .treatmentRecommendation("Baños terapéuticos de inmersión en campo con Cloruro de Sodio (Sal marina sin yodo) a concentración de 3 a 5 kg/m³ (0.3% - 0.5%) por 24-48 horas, o baños cortos de 10-15 g/L por 10 minutos con oxigenación forzada. Tratamiento antibacteriano con oxitetraciclina en caso de afección sistémica severa.")
            .samplingInstructions("Frotis directo en fresco de mucus cutáneo y filamentos branquiales fijados en portaobjetos; remitir al laboratorio para tinción de Gram o PCR.")
            .build());

        list.add(DiseaseProfile.builder()
            .diseaseName("Hipoxia Severa / Anoxia por Colapso de Oxígeno Disuelto")
            .pathogen("Desbalance Físico-Químico Ambiental (OD < 2.0 mg/L)")
            .productionType("PISCICULTURA")
            .primaryKeywords(Arrays.asList("boqueo", "superficie", "madrugada", "oxigeno", "respirar", "ahogo", "boca abierta"))
            .secondaryKeywords(Arrays.asList("agua oscura", "turbia", "olor podrido", "sin lesiones", "peces grandes primero"))
            .urgencyLevel("CRITICAL")
            .keyIndicator("Boqueo masivo en la capa superficial del agua en horas de la madrugada sin lesiones externas evidentes")
            .biosecurityProtocol("1. ENCENDIDO INMEDIATO DE AIREACIÓN MECÁNICA (blowers, paletas o inyectores splash) al 100% de capacidad.\n"
                + "2. Apertura total de caídas y flujos de agua fresca superficial.\n"
                + "3. SUSPENSIÓN TOTAL DE LA ALIMENTACIÓN. El proceso de digestión incrementa drásticamente el consumo metabólico de oxígeno.")
            .treatmentRecommendation("Manejo zootécnico de emergencia: No suministrar alimento hasta que el OD supere 4.5 mg/L de forma sostenida durante el mediodía. En estanques de tierra, aplicar carbonato de calcio (cal agrícola) a 50 g/m² si el agua está ácida y rica en materia orgánica en descomposición.")
            .samplingInstructions("Medición horaria in situ con oxímetro digital calibrado y disco Secchi. Medir pH, temperatura y nitritos (NO2-).")
            .build());

        list.add(DiseaseProfile.builder()
            .diseaseName("Ictioftiriasis / Enfermedad del Punto Blanco")
            .pathogen("Ichthyophthirius multifiliis (Protozoo ciliado)")
            .productionType("PISCICULTURA")
            .primaryKeywords(Arrays.asList("punto blanco", "puntos blancos", "granos", "frotan", "rascan", "fondo", "orilla", "escamas"))
            .secondaryKeywords(Arrays.asList("aletas pegadas", "letargia", "mucus", "adelgazamiento"))
            .urgencyLevel("MODERATE")
            .keyIndicator("Presencia de diminutos puntos blanquecinos tipo granos de sal (0.5 a 1.0 mm) en cuerpo y aletas con prurito")
            .biosecurityProtocol("1. Restringir movimiento de agua entre estanques interconectados.\n"
                + "2. Incrementar flujo de agua para barrer los terontes (estadio libre infectante del parásito).\n"
                + "3. Desinfección de chinchorros y cubetas con secado al sol por 48 horas.")
            .treatmentRecommendation("Tratamiento mediante adición de sal marina (NaCl) al estanque a 3-4 kg/m³ de agua durante 7 días continuos para interrumpir el ciclo biológico del parásito. En truchicultura, baños continuos con verde de malaquita/formol únicamente si está expresamente aprobado por autoridad sanitaria local.")
            .samplingInstructions("Raspado de piel y aletas con bisturí; observación microscópica inmediata en campo a 10x y 40x identificando el trofonte característico con núcleo en forma de herradura.")
            .build());

        // =========================================================================
        // 2. PATOLOGÍAS PORCÍCOLAS (PRECEBO, LEVANTE, CEBA, REPRODUCTORAS)
        // =========================================================================
        list.add(DiseaseProfile.builder()
            .diseaseName("Síndrome Respiratorio y Reproductivo Porcino (PRRS)")
            .pathogen("PRRS Arterivirus Porcino")
            .productionType("PORCICULTURA")
            .primaryKeywords(Arrays.asList("oreja azul", "cianosis", "disnea", "tos espasmodica", "fiebre 41", "postracion", "aborto", "lechones debiles"))
            .secondaryKeywords(Arrays.asList("pulmonia", "estornudo", "ojos llorosos", "inapetencia", "mortalidad alta lechones"))
            .urgencyLevel("CRITICAL")
            .keyIndicator("Dificultad respiratoria aguda acompañada de coloración azulada en orejas/hocico y abortos en hembras")
            .biosecurityProtocol("1. NOTIFICACIÓN INMEDIATA OBLIGATORIA AL ICA: Enfermedad de vigilancia epidemiológica oficial.\n"
                + "2. Aislamiento absoluto del galpón afectado. Restricción total de movimiento de operarios y camiones de transporte.\n"
                + "3. Implementación estricta del sistema 'Todo Dentro - Todo Fuera' (All-in / All-out) con desinfección termonebulizada de virucidas de amplio espectro (Glutaraldehído + Amonio Cuaternario).")
            .treatmentRecommendation("Soporte sintomático y metafilaxia para evitar infecciones bacterianas secundarias: Tilosina o Doxiciclina vía pienso/agua para controlar coinfecciones respiratorias. Antipiréticos (Paracetamol o Flunixin meglumine a 2.2 mg/kg IM) en animales con fiebre >40°C.")
            .samplingInstructions("Toma de sangre entera en tubos sin anticoagulante para suero de 10 animales sintomáticos; remitir en refrigeración para prueba de RT-PCR y ELISA al centro de diagnóstico ICA.")
            .build());

        list.add(DiseaseProfile.builder()
            .diseaseName("Erisipela Porcina / Mal Rojo")
            .pathogen("Erysipelothrix rhusiopathiae (Bacteria Gram positiva)")
            .productionType("PORCICULTURA")
            .primaryKeywords(Arrays.asList("diamante", "rombo", "manchas rojas", "cuadradas", "artritis", "cojera", "postrado", "rigido", "fiebre alta"))
            .secondaryKeywords(Arrays.asList("muerte subita", "inapetencia", "orejas rojas", "piel roja", "costras"))
            .urgencyLevel("HIGH")
            .keyIndicator("Lesiones cutáneas eritematosas características en forma geométrica de rombo o diamante con fiebre alta")
            .biosecurityProtocol("1. Trasladar de inmediato a los ejemplares con lesiones al corral de enfermería.\n"
                + "2. Retirar y desinfectar las camas de viruta o paja. Lavado a presión con soda cáustica al 2% o detergente alcalino.\n"
                + "3. Evitar contacto de aves silvestres o roedores con los comederos.")
            .treatmentRecommendation("Tratamiento antibiótico de rápida respuesta: Penicilina G Procaínica (20,000 UI/kg IM cada 24 horas por 3 a 5 días) o Amoxicilina inyectable. Tratamiento antiinflamatorio con Ketoprofeno o Meloxicam.\n"
                + "TIEMPO DE RETIRO ICA: Respetar 14 días de retiro antes del envío a planta de beneficio.")
            .samplingInstructions("Biopsia de piel de bordes de lesiones romboidales en solución salina estéril y bazo/articulación afectada para cultivo bacteriológico.")
            .build());

        list.add(DiseaseProfile.builder()
            .diseaseName("Neumonía Enzoótica Porcina")
            .pathogen("Mycoplasma hyopneumoniae")
            .productionType("PORCICULTURA")
            .primaryKeywords(Arrays.asList("tos seca", "tos perruna", "retraso", "flaco", "pelo erizado", "hirsuto", "no crece", "fcr alto"))
            .secondaryKeywords(Arrays.asList("estornudo", "respiracion rapida", "ceba lenta", "polvo", "amoniaco", "galpon frio"))
            .urgencyLevel("HIGH")
            .keyIndicator("Tos seca persistente de tipo bronquial no productiva con retraso crónico en ganancia diaria de peso")
            .biosecurityProtocol("1. Mejorar el manejo de cortinas: Ventilar para mantener niveles de amoníaco por debajo de 10 ppm.\n"
                + "2. Corregir corrientes de aire frío directo y humedad excesiva en los corrales de levante.\n"
                + "3. Desensibilizar densidades y asegurar que no haya sobrecupo zootécnico en los corrales.")
            .treatmentRecommendation("Tratamiento metafiláctico en el alimento o agua de bebida: Tilosina fosfato (100 ppm), Tilvalosina o Lincomicina + Espectinomicina por 7 a 14 días consecutivos bajo prescripción zootécnica/veterinaria.")
            .samplingInstructions("Inspección de pulmones en planta de beneficio evaluando porcentaje de consolidación cráneo-ventral y frotis bronquial para PCR.")
            .build());

        list.add(DiseaseProfile.builder()
            .diseaseName("Estrés Térmico y Golpe de Calor Porcino")
            .pathogen("Hipertermia Ambiental no Infecciosa (Temp > 30°C)")
            .productionType("PORCICULTURA")
            .primaryKeywords(Arrays.asList("jadeo", "boca abierta", "espuma", "boca", "acostado", "no se levanta", "calor", "bochorno", "asfixia"))
            .secondaryKeywords(Arrays.asList("cerdo gordo", "ceba", "bebedero lleno", "tarde", "mediodia", "muerte subita ceba"))
            .urgencyLevel("CRITICAL")
            .keyIndicator("Jadeo extremo con boca abierta, salivación espumosa y postración en decúbito lateral en horas calurosas")
            .biosecurityProtocol("1. ACTIVAR INMEDIATAMENTE nebulizadores y aspersores de techo o mojar con manguera el lomo de los animales.\n"
                + "2. Abrir al 100% las cortinas laterales del galpón y encender ventiladores de soporte.\n"
                + "3. Asegurar caudal de agua fresca continuo en chupetes: mínimo 1.5 a 2.0 litros/minuto por bebedero en ceba.")
            .treatmentRecommendation("Manejo etológico y ambiental: NO forzar a caminar ni estresar al animal en crisis. Aplicar agua fresca (no helada) en cuello y patas. Administrar electrolitos en el agua de bebida y suspender el suministro de concentrado durante las horas de máximo calor.")
            .samplingInstructions("Control horario de temperatura y humedad relativa (Índice ITH) en galpón. Monitorear caudal y temperatura del agua de bebida.")
            .build());

        return Collections.unmodifiableList(list);
    }

    /**
     * Procesa una consulta clínica y genera un dictamen zootécnico preliminar asistido (HU-12).
     */
    @Transactional
    public VetConsultationResponse createConsultation(VetConsultationRequest request, UUID ownerId) {
        log.info("Procesando consulta veterinaria asistida para granja {} (tipo {})", request.farmId(), request.productionType());

        // 1. Validar propiedad de la granja
        Farm farm = farmService.findFarmEntity(request.farmId(), ownerId);

        // 2. Resolver datos del lote si fue suministrado
        Batch batch = null;
        if (request.batchId() != null) {
            batch = batchRepository.findById(request.batchId()).orElse(null);
        }

        // 3. Normalizar texto de síntomas para cotejo clínico
        String normalizedSymptoms = normalizeText(request.symptomsDescription());
        String prodTypeNormalized = request.productionType().toUpperCase(Locale.ROOT);

        // 4. Evaluar base de conocimiento y calcular scoring de concordancia
        List<ScoredDiagnosis> scoredList = new ArrayList<>();

        for (DiseaseProfile profile : KNOWLEDGE_BASE) {
            // Filtrar patologías según el sistema productivo (piscicultura vs porcicultura)
            if (!profile.getProductionType().equalsIgnoreCase(prodTypeNormalized)
                    && !prodTypeNormalized.contains(profile.getProductionType())) {
                continue;
            }

            double score = calculateMatchScore(normalizedSymptoms, profile);
            if (score > 0.0) {
                scoredList.add(new ScoredDiagnosis(profile, score));
            }
        }

        // Ordenar diagnósticos de mayor a menor concordancia
        scoredList.sort(Comparator.comparingDouble(ScoredDiagnosis::score).reversed());

        DiseaseProfile selectedDiagnosis;
        BigDecimal confidencePct;
        List<DifferentialDiagnosisDto> differentials = new ArrayList<>();

        if (!scoredList.isEmpty()) {
            ScoredDiagnosis best = scoredList.get(0);
            selectedDiagnosis = best.profile();

            // Calcular porcentaje de confianza acotado entre 75% y 98%
            double rawScore = best.score();
            double normalizedConfidence = Math.min(98.0, Math.max(74.0, 70.0 + (rawScore * 3.5)));
            confidencePct = BigDecimal.valueOf(normalizedConfidence).setScale(2, RoundingMode.HALF_UP);

            // Armar diagnósticos diferenciales secundarios
            for (ScoredDiagnosis sd : scoredList) {
                double diffConfidence = Math.min(95.0, Math.max(40.0, 50.0 + (sd.score() * 3.0)));
                differentials.add(new DifferentialDiagnosisDto(
                    sd.profile().getDiseaseName(),
                    sd.profile().getPathogen(),
                    Math.round(diffConfidence * 10.0) / 10.0,
                    sd.profile().getKeyIndicator()
                ));
            }
        } else {
            // Caso sin coincidencia exacta: emitir diagnóstico genérico preventivo
            selectedDiagnosis = DiseaseProfile.builder()
                .diseaseName("Síndrome de Estrés Ambiental e Infección Oportunista")
                .pathogen("Agentes Mixtos / Factores de Manejo")
                .productionType(prodTypeNormalized)
                .urgencyLevel("MODERATE")
                .keyIndicator("Signos inespecíficos compatibles con estrés por densidad, alimentación o calidad ambiental")
                .biosecurityProtocol("1. Realizar inspección visual exhaustiva de comederos, bebederos y calidad de agua/camas.\n"
                    + "2. Aislar inmediatamente a los animales que presenten postración o apatía.\n"
                    + "3. Registrar parámetros físico-químicos (oxígeno/temperatura/amoníaco) y evitar manejos bruscos.")
                .treatmentRecommendation("Terapia de soporte general: Ajustar densidad poblacional, verificar estado microbiológico del alimento y consultar al médico veterinario oficial para toma de muestras.")
                .samplingInstructions("Toma de muestras de agua, alimento balanceado y raspados/frotis de ejemplares afectados para laboratorio.")
                .build();
            confidencePct = new BigDecimal("70.00");
            differentials.add(new DifferentialDiagnosisDto(
                selectedDiagnosis.getDiseaseName(),
                selectedDiagnosis.getPathogen(),
                70.0,
                selectedDiagnosis.getKeyIndicator()
            ));
        }

        // 5. Serializar lista de diferenciales en formato JSON para auditoría en BD
        String differentialsJson = "[]";
        try {
            differentialsJson = objectMapper.writeValueAsString(differentials);
        } catch (Exception e) {
            log.warn("No se pudo serializar lista de diferenciales a JSON: {}", e.getMessage());
        }

        // 6. Persistir la consulta clínica en la base de datos
        VetConsultation entity = VetConsultation.builder()
            .farmId(farm.getId())
            .batchId(batch != null ? batch.getId() : null)
            .productionType(prodTypeNormalized)
            .symptomsDescription(request.symptomsDescription())
            .presumptiveDiagnosis(selectedDiagnosis.getDiseaseName())
            .urgencyLevel(selectedDiagnosis.getUrgencyLevel())
            .confidencePercentage(confidencePct)
            .biosecurityProtocol(selectedDiagnosis.getBiosecurityProtocol())
            .treatmentRecommendation(selectedDiagnosis.getTreatmentRecommendation())
            .samplingInstructions(selectedDiagnosis.getSamplingInstructions())
            .differentialDiagnoses(differentialsJson)
            .veterinarianReviewed(false)
            .createdAt(Instant.now())
            .build();

        VetConsultation saved = vetConsultationRepository.save(entity);
        log.info("Consulta veterinaria {} guardada exitosamente con diagnóstico presuntivo: {}", saved.getId(), saved.getPresumptiveDiagnosis());

        return toResponse(saved, batch != null ? batch.getBatchCode() : null, differentials);
    }

    /**
     * Consulta el historial de diagnósticos veterinarios de una granja.
     */
    @Transactional(readOnly = true)
    public List<VetConsultationResponse> getConsultationsByFarm(UUID farmId, UUID ownerId) {
        farmService.findFarmEntity(farmId, ownerId);
        List<VetConsultation> list = vetConsultationRepository.findByFarmIdOrderByCreatedAtDesc(farmId);
        return list.stream().map(this::mapEntityToResponse).toList();
    }

    /**
     * Consulta el historial de diagnósticos veterinarios vinculados a un lote específico.
     */
    @Transactional(readOnly = true)
    public List<VetConsultationResponse> getConsultationsByBatch(UUID batchId, UUID ownerId) {
        Batch batch = batchRepository.findById(batchId).orElse(null);
        if (batch != null && batch.getFarm() != null) {
            farmService.findFarmEntity(batch.getFarm().getId(), ownerId);
        }
        List<VetConsultation> list = vetConsultationRepository.findByBatchIdOrderByCreatedAtDesc(batchId);
        return list.stream().map(this::mapEntityToResponse).toList();
    }

    private VetConsultationResponse mapEntityToResponse(VetConsultation entity) {
        String batchCode = null;
        if (entity.getBatchId() != null) {
            batchCode = batchRepository.findById(entity.getBatchId())
                .map(Batch::getBatchCode)
                .orElse(null);
        }

        List<DifferentialDiagnosisDto> differentials = new ArrayList<>();
        if (entity.getDifferentialDiagnoses() != null && !entity.getDifferentialDiagnoses().isBlank()) {
            try {
                differentials = objectMapper.readValue(entity.getDifferentialDiagnoses(),
                    new TypeReference<List<DifferentialDiagnosisDto>>() {});
            } catch (Exception e) {
                log.warn("Error deserializando diagnósticos diferenciales de consulta {}: {}", entity.getId(), e.getMessage());
            }
        }

        return toResponse(entity, batchCode, differentials);
    }

    private VetConsultationResponse toResponse(VetConsultation entity, String batchCode, List<DifferentialDiagnosisDto> differentials) {
        return new VetConsultationResponse(
            entity.getId(),
            entity.getFarmId(),
            entity.getBatchId(),
            batchCode,
            entity.getProductionType(),
            entity.getSymptomsDescription(),
            entity.getPresumptiveDiagnosis(),
            entity.getUrgencyLevel(),
            entity.getConfidencePercentage(),
            entity.getBiosecurityProtocol(),
            entity.getTreatmentRecommendation(),
            entity.getSamplingInstructions(),
            differentials,
            entity.getVeterinarianReviewed(),
            entity.getCreatedAt()
        );
    }

    private double calculateMatchScore(String text, DiseaseProfile profile) {
        double score = 0.0;

        // Ponderación de palabras clave primarias (peso 3.0 por coincidencia)
        for (String kw : profile.getPrimaryKeywords()) {
            String normKw = normalizeText(kw);
            if (text.contains(normKw)) {
                score += 3.0;
            }
        }

        // Ponderación de palabras clave secundarias (peso 1.0 por coincidencia)
        for (String kw : profile.getSecondaryKeywords()) {
            String normKw = normalizeText(kw);
            if (text.contains(normKw)) {
                score += 1.0;
            }
        }

        return score;
    }

    private static String normalizeText(String input) {
        if (input == null) return "";
        String nfdNormalizedString = Normalizer.normalize(input.toLowerCase(Locale.ROOT), Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(nfdNormalizedString).replaceAll("");
    }

    private record ScoredDiagnosis(DiseaseProfile profile, double score) {}
}
