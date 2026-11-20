"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type Role = "organizer" | "participant";

type FieldErrors = {
    email?: string;
    password?: string;
    root?: string;
};

function validateEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function mapAuthError(err?: string): string {
    if (!err) return "Sign-in failed. Check your details and try again.";
    const code = String(err);
    if (code.includes("CredentialsSignin")) return "Invalid email or password.";
    if (code.includes("AccessDenied")) return "Access denied for this account.";
    if (code.includes("OAuthAccountNotLinked")) return "This email is linked to another sign-in method.";
    return "Something went wrong while signing in.";
}

export default function useAuthHook(edition: "one" | "two" = "two") {
    const prefix = edition === "one" ? "/archive-nexhack-one" : "";
    const router = useRouter();
    const [role, setRole] = useState<Role>("participant");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<FieldErrors>({});
    const [loading, setLoading] = useState(false);
    const submittingRef = useRef(false);
    const mountedRef = useRef(true);

    const validate = useCallback(() => {
        const e: FieldErrors = {};
        const em = email.trim();
        if (!em) e.email = "Email is required";
        else if (!validateEmail(em)) e.email = "Enter a valid email";
        if (role === "organizer") {
            if (!password) e.password = "Password is required";
            else if (password.length < 6) e.password = "Min 6 characters";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }, [email, password, role]);

    const onChangeRole = useCallback((r: Role) => {
        setRole(r);
        setErrors({});
    }, []);

    const submit = useCallback(async () => {
        if (!validate()) return false;
        if (submittingRef.current) return false;
        submittingRef.current = true;
        setLoading(true);
        setErrors({});
        try {
            const res = await signIn("credentials", {
                redirect: false,
                email: email.trim(),
                password: role === "organizer" ? password : "",
                role, edition,
                callbackUrl: prefix + (role === "organizer" ? "/admin" : "/participants"),
            });
            if (res && res.ok && !res.error) {
                router.push(prefix + (role === "organizer" ? "/admin" : "/participants"));
                router.refresh?.();
                return true;
            }
            setErrors((prev) => ({ ...prev, root: mapAuthError(res?.error || "") }));
            return false;
        } catch {
            setErrors((prev) => ({ ...prev, root: "Network error. Please try again." }));
            return false;
        } finally {
            if (mountedRef.current) setLoading(false);
            submittingRef.current = false;
        }
    }, [email, password, role, edition, prefix, validate, router]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    return { role, email, password, errors, loading, setEmail, setPassword, onChangeRole, submit };
};