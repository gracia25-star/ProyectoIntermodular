package com.edugestion.model;

public class User {

    private int idUser;
    private String name;
    private String email;
    private String password;
    private Integer codeDept;  // nullable FK → department
    private Integer codeRole;  // nullable FK → role

    public User() {}

    public User(int idUser, String name, String email, String password,
                Integer codeDept, Integer codeRole) {
        this.idUser   = idUser;
        this.name     = name;
        this.email    = email;
        this.password = password;
        this.codeDept = codeDept;
        this.codeRole = codeRole;
    }

    public int getIdUser() { return idUser; }
    public void setIdUser(int idUser) { this.idUser = idUser; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Integer getCodeDept() { return codeDept; }
    public void setCodeDept(Integer codeDept) { this.codeDept = codeDept; }

    public Integer getCodeRole() { return codeRole; }
    public void setCodeRole(Integer codeRole) { this.codeRole = codeRole; }
}
