package com.agro.modules.farm.domain;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


 /*
  Entidad de Dominio: Farm Granja / Unidad Productiva Raíz)   
  Representa la explotación física donde se ubican los estanques e instalaciones.                    
  Es la raíz agregada para el control financiero y biológico del productor.                          
 */ 
@Entity 
@Table (name = "farm")
@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder 
public class Farm {
    
    @Id 
    @GeneratedValue (strategy = GenerationType.UUID)
    @Column (name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column (name = "name", nullable = false, length = 150)
    private String name;

    /*
    Identificador del usuario propietario (obtenido del token JWT).
    Garantiza el aislamiento de datos por usuario (tenancy lógico).
    */ 
    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;
    
    @Column(name = "location", columnDefinition = "TEXT")
    private String location;

    /*
    Marca de tiempo de registro en la base de datos (con zona horaria).
    */
    @CreationTimestamp 
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    /*
    Relación uno-a-muchos con los estanques de la granja.         
    Si se elimina la granja, en cascada se gestionan sus            
    instalaciones.
    */
    @OneToMany (mappedBy = "farm", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Pond> ponds = new ArrayList<>();
      
}
