package com.edugestion.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class PurchaseOrder {

    private int codeOrder;
    private Timestamp date;
    private BigDecimal amount;
    private Integer idBudget;    // nullable FK → budget
    private Integer idSupplier;  // nullable FK → supplier

    public PurchaseOrder() {}

    public PurchaseOrder(int codeOrder, Timestamp date, BigDecimal amount,
                         Integer idBudget, Integer idSupplier) {
        this.codeOrder  = codeOrder;
        this.date       = date;
        this.amount     = amount;
        this.idBudget   = idBudget;
        this.idSupplier = idSupplier;
    }

    public int getCodeOrder() { return codeOrder; }
    public void setCodeOrder(int codeOrder) { this.codeOrder = codeOrder; }

    public Timestamp getDate() { return date; }
    public void setDate(Timestamp date) { this.date = date; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public Integer getIdBudget() { return idBudget; }
    public void setIdBudget(Integer idBudget) { this.idBudget = idBudget; }

    public Integer getIdSupplier() { return idSupplier; }
    public void setIdSupplier(Integer idSupplier) { this.idSupplier = idSupplier; }
}
