package com.edugestion.model;

public class DeptSupplier {

    private int codeDept;
    private int idSupplier;

    public DeptSupplier() {}

    public DeptSupplier(int codeDept, int idSupplier) {
        this.codeDept   = codeDept;
        this.idSupplier = idSupplier;
    }

    public int getCodeDept() { return codeDept; }
    public void setCodeDept(int codeDept) { this.codeDept = codeDept; }

    public int getIdSupplier() { return idSupplier; }
    public void setIdSupplier(int idSupplier) { this.idSupplier = idSupplier; }
}
