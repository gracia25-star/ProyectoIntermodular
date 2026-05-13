package com.edugestion.model;

public class Role {

    private int codeRole;
    private String name;

    public Role() {}

    public Role(int codeRole, String name) {
        this.codeRole = codeRole;
        this.name = name;
    }

    public int getCodeRole() { return codeRole; }
    public void setCodeRole(int codeRole) { this.codeRole = codeRole; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
