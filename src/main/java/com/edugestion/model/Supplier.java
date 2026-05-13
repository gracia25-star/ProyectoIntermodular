package com.edugestion.model;

public class Supplier {

    private int idSupplier;
    private String name;
    private String cif;
    private String address;
    private String phone;
    private String mail;

    public Supplier() {}

    public Supplier(int idSupplier, String name, String cif,
                    String address, String phone, String mail) {
        this.idSupplier = idSupplier;
        this.name       = name;
        this.cif        = cif;
        this.address    = address;
        this.phone      = phone;
        this.mail       = mail;
    }

    public int getIdSupplier() { return idSupplier; }
    public void setIdSupplier(int idSupplier) { this.idSupplier = idSupplier; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCif() { return cif; }
    public void setCif(String cif) { this.cif = cif; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getMail() { return mail; }
    public void setMail(String mail) { this.mail = mail; }
}
