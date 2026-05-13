package com.edugestion.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class Invoice {

    private int codeInvoice;
    private Timestamp date;
    private BigDecimal totalAmount;
    private byte[] pdfFile;       // nullable BLOB
    private Integer codeOrder;    // nullable FK → purchase_order

    public Invoice() {}

    public Invoice(int codeInvoice, Timestamp date, BigDecimal totalAmount,
                   byte[] pdfFile, Integer codeOrder) {
        this.codeInvoice = codeInvoice;
        this.date        = date;
        this.totalAmount = totalAmount;
        this.pdfFile     = pdfFile;
        this.codeOrder   = codeOrder;
    }

    public int getCodeInvoice() { return codeInvoice; }
    public void setCodeInvoice(int codeInvoice) { this.codeInvoice = codeInvoice; }

    public Timestamp getDate() { return date; }
    public void setDate(Timestamp date) { this.date = date; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public byte[] getPdfFile() { return pdfFile; }
    public void setPdfFile(byte[] pdfFile) { this.pdfFile = pdfFile; }

    public Integer getCodeOrder() { return codeOrder; }
    public void setCodeOrder(Integer codeOrder) { this.codeOrder = codeOrder; }
}
