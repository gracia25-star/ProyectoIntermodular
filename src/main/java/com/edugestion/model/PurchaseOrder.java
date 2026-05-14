package com.edugestion.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class PurchaseOrder {

    private int codeOrder;
    private String orderReference; // nº de orden visible (7 dígitos o DeptAbrev/NNN/AAAA/tipo)
    private String description;    // descripción introducida por el jefe
    private Timestamp date;
    private BigDecimal amount;
    private Integer idBudget;      // nullable FK → budget
    private Integer idSupplier;    // nullable FK → supplier
    private String status;         // "pending" | "approved"
    private String comment;        // nullable, observaciones del admin

    public PurchaseOrder() {}

    public PurchaseOrder(int codeOrder, String orderReference, String description,
                         Timestamp date, BigDecimal amount,
                         Integer idBudget, Integer idSupplier,
                         String status, String comment) {
        this.codeOrder      = codeOrder;
        this.orderReference = orderReference;
        this.description    = description;
        this.date           = date;
        this.amount         = amount;
        this.idBudget       = idBudget;
        this.idSupplier     = idSupplier;
        this.status         = status;
        this.comment        = comment;
    }

    public int getCodeOrder() { return codeOrder; }
    public void setCodeOrder(int codeOrder) { this.codeOrder = codeOrder; }

    public String getOrderReference() { return orderReference; }
    public void setOrderReference(String orderReference) { this.orderReference = orderReference; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Timestamp getDate() { return date; }
    public void setDate(Timestamp date) { this.date = date; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public Integer getIdBudget() { return idBudget; }
    public void setIdBudget(Integer idBudget) { this.idBudget = idBudget; }

    public Integer getIdSupplier() { return idSupplier; }
    public void setIdSupplier(Integer idSupplier) { this.idSupplier = idSupplier; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
