package com.edugestion.model;

public class Department {

    private int codeDept;
    private String name;

    public Department() {}

    public Department(int codeDept, String name) {
        this.codeDept = codeDept;
        this.name = name;
    }

    public int getCodeDept() { return codeDept; }
    public void setCodeDept(int codeDept) { this.codeDept = codeDept; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
