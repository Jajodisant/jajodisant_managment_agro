package com.agro.modules.farm.domain;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GenerationType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


/*
  Entidad de Dominio: Pond (Estanque / Infraestructura Física  
  de Cultivo)                                
  Modela la unidad física donde habitan y se alimentan los lotes de peces.                              
  Controla dimensiones, volumen hídrico y límites biológicos de densidad.                           
*/        
@Entity 
@Table (name = "pond")
@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder 
public class Pond {

    @Id 
    @GeneratedValue (strategy = GenerationType.UUID)
    @Column (name = "id", updatable = false, nullable = false)
    private UUID id;

    /*
    Granja a la que pertenece este estanque.                      
    Carga perezosa (LAZY) para optimización de rendimiento.        
    */    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn (name = "farm_id", nullable = false)
    private Farm farm;

    /*
    Código identificador de campo del estanque (ej: 'Estanque T-01','Tanque circular 2')
    */
    @Column (name = "code_name", nullable = false, length = 50)
    private String codeName;

    /*
    Tipo de construcción: earthen (tierra), geomembrane       
    (geomembrana), concrete (concreto), cage (jaula flotante).              
    */ 
    @Column (name = "pond_type", nullable = false, length = 50)
    @Builder.Default
    private String pondType = "earthen";

    @Column (name = "length_m", precision = 8, scale = 2)
    private BigDecimal lengthM;

    @Column (name = "width_m", precision = 8, scale = 2)
    private BigDecimal widthM;

    @Column(name = "avg_depth_m",nullable = false, precision = 6, scale = 2)                          
    private BigDecimal avgDepthM; 
                                      
    /*
    Volumen en metros cúbicos (m³).                               
    Calculado automáticamente por PostgreSQL (STORED GENERATED COLUMN).                            
    Se marca como no insertable ni actualizable para que Hibernate  
    no intente sobrescribirlo.          
    */                           
    @Column(name = "volume_m3", precision = 10, scale = 2, insertable = false, updatable = false)                              
    private BigDecimal volumeM3;  
                                      
    /*
    Indica si el estanque cuenta con sistemas de aireación mecánica (splasher, paletas, blower).
    Si es true, el estanque tolera densidades de siembra y biomasa significativamente mayores. 
   */                           
    @Builder.Default              
    @Column(name = "has_aeration",nullable = false)                   
    private boolean hasAeration = false;                              
                              
    /*
    Límite máximo de densidad zootécnica recomendado (kg de pez / m³ de agua).                        
    Valor por defecto: 3.0 kg/m³ en estanques convencionales de tierra sin aireación forzada.       
    */
    @Column(name = "max_density_kg_m3", nullable = false, precision = 6, scale = 2) 
    @Builder.Default
    private BigDecimal maxDensityKgM3 = new BigDecimal("3.00");           

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @CreationTimestamp            
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

}
