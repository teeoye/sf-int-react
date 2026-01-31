"use client"

import React from "react";

export interface Token {
    token: string;
    expiresAt: number;
}

export function useAccessToken() {
    console.log('useAccessToken hook initialized');
    const [token, setToken] = React.useState<Token | null>(null);
    console.log('[Auth] useAccessToken hook initialized');

    React.useEffect(() => {
        console.log('[Auth] Initial token fetch starting...');
        const fetchToken = async () => {
            try {
                console.log('[Auth] Fetching token from /api/jwt...');
                const response = await fetch("/api/jwt");
                console.log('[Auth] Token fetch response:', { 
                    status: response.status, 
                    ok: response.ok 
                });

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    console.error('[Auth] Failed to fetch token:', { 
                        status: response.status, 
                        error: errorText 
                    });
                    return;
                }

                const { token: newToken } = await response.json();
                console.log('[Auth] Token received:', { 
                    expiresAt: newToken.expiresAt,
                    hasToken: !!newToken.token 
                });
                setToken(newToken);
            } catch (error) {
                console.error('[Auth] Error fetching token:', error);
                if (error instanceof Error) {
                    console.error('[Auth] Error details:', {
                        message: error.message,
                        stack: error.stack,
                        name: error.name
                    });
                }
            }
        };

        fetchToken();
    }, []);

    React.useEffect(() => {
        if (!token?.expiresAt) {
            console.log('[Auth] No token expiration, skipping refresh interval setup');
            return;
        }

        console.log('[Auth] Setting up token refresh interval, expires at:', token.expiresAt);
        const intervalId = setInterval(async () => {
            const currentTime = Date.now() / 1000;
            console.log('[Auth] Checking token expiration:', { 
                currentTime, 
                expiresAt: token.expiresAt,
                expired: currentTime >= token.expiresAt 
            });

            if (currentTime < token.expiresAt) {
                console.log('[Auth] Token still valid, skipping refresh');
                return;
            }

            console.log('[Auth] Token expired, refreshing...');
            try {
                const response = await fetch("/api/jwt");
                console.log('[Auth] Token refresh response:', { 
                    status: response.status, 
                    ok: response.ok 
                });

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    console.error('[Auth] Failed to refresh token:', { 
                        status: response.status, 
                        error: errorText 
                    });
                    return;
                }

                const { token: newToken } = await response.json();
                console.log('[Auth] Token refreshed successfully:', { 
                    expiresAt: newToken.expiresAt,
                    hasToken: !!newToken.token 
                });
                setToken(newToken);
            } catch (error) {
                console.error('[Auth] Error refreshing token:', error);
                if (error instanceof Error) {
                    console.error('[Auth] Error details:', {
                        message: error.message,
                        stack: error.stack,
                        name: error.name
                    });
                }
            }
        }, 60000);

        return () => {
            console.log('[Auth] Clearing token refresh interval');
            clearInterval(intervalId);
        };
    }, [token?.expiresAt]);

    const currentToken = token?.token ?? '';
    console.log('[Auth] Returning token:', { hasToken: !!currentToken });
    return { token: currentToken };
}