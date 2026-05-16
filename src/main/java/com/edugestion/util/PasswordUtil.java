package com.edugestion.util;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.Base64;

public class PasswordUtil {

    private static final int ITERATIONS = 65_536;
    private static final int KEY_BITS   = 256;
    private static final String ALGO    = "PBKDF2WithHmacSHA256";

    /** Devuelve "iter:saltB64:hashB64" listo para guardar en BD. */
    public static String hash(String plaintext) {
        byte[] salt = new byte[16];
        new SecureRandom().nextBytes(salt);
        byte[] hash = pbkdf2(plaintext.toCharArray(), salt, ITERATIONS);
        return ITERATIONS + ":"
             + Base64.getEncoder().encodeToString(salt) + ":"
             + Base64.getEncoder().encodeToString(hash);
    }

    /** Compara en tiempo constante para evitar timing attacks. */
    public static boolean verify(String plaintext, String stored) {
        if (stored == null) return false;
        String[] parts = stored.split(":", 3);
        if (parts.length != 3) return false;
        int    iters        = Integer.parseInt(parts[0]);
        byte[] salt         = Base64.getDecoder().decode(parts[1]);
        byte[] expectedHash = Base64.getDecoder().decode(parts[2]);
        byte[] actualHash   = pbkdf2(plaintext.toCharArray(), salt, iters);
        return slowEquals(expectedHash, actualHash);
    }

    private static byte[] pbkdf2(char[] password, byte[] salt, int iterations) {
        try {
            PBEKeySpec spec = new PBEKeySpec(password, salt, iterations, KEY_BITS);
            return SecretKeyFactory.getInstance(ALGO).generateSecret(spec).getEncoded();
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new RuntimeException("Error en hashing de contraseña", e);
        }
    }

    private static boolean slowEquals(byte[] a, byte[] b) {
        int diff = a.length ^ b.length;
        for (int i = 0; i < a.length && i < b.length; i++) diff |= a[i] ^ b[i];
        return diff == 0;
    }
}
