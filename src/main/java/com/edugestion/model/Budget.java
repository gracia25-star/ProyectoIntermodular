package com.edugestion.model;

import java.math.BigDecimal;

public class Budget {

    private int idBudget;
    private BigDecimal totalAmount;
    private int year;
    private int type;          // 1 = presupuesto normal, 2 = plan de inversión
    private Integer codeDept;  // nullable FK → department

    public Budget() {}

    public Budget(int idBudget, BigDecimal totalAmount, int year, int type, Integer codeDept) {
        this.idBudget    = idBudget;
        this.totalAmount = totalAmount;
        this.year        = year;
        this.type        = type;
        this.codeDept    = codeDept;
    }

    public int getIdBudget() { return idBudget; }
    public void setIdBudget(int idBudget) { this.idBudget = idBudget; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public int getType() { return type; }
    public void setType(int type) { this.type = type; }

    public Integer getCodeDept() { return codeDept; }
    public void setCodeDept(Integer codeDept) { this.codeDept = codeDept; }
}
