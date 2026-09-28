import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../utils/supabase";

export default function AuthCallbackScreen() {
	const { code, error, error_description: errorDescription } =
		useLocalSearchParams<{
			code?: string;
			error?: string;
			error_description?: string;
		}>();
	const router = useRouter();
	const handled = useRef(false);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		if (handled.current) return;
		handled.current = true;

		const authCode = Array.isArray(code) ? code[0] : code;
		const authError = Array.isArray(error) ? error[0] : error;
		const authErrorDescription = Array.isArray(errorDescription)
			? errorDescription[0]
			: errorDescription;

		if (authError || !authCode) {
			setMessage(
				authErrorDescription ||
					(authError
						? "This confirmation link is invalid or has expired."
						: "The confirmation link is missing its sign-in code."),
			);
			return;
		}

		void supabase.auth
			.exchangeCodeForSession(authCode)
			.then(({ error: exchangeError, data }) => {
				if (exchangeError || !data.session) {
					setMessage(
						exchangeError?.message ||
							"This confirmation link is invalid or has expired.",
					);
					return;
				}

				router.replace("/(tabs)");
			})
			.catch((exchangeError: unknown) => {
				setMessage(
					exchangeError instanceof Error
						? exchangeError.message
						: "Unable to complete email confirmation.",
				);
			});
	}, [code, error, errorDescription, router]);

	return (
		<View style={styles.container}>
			{message ? (
				<>
					<Text style={styles.title}>Confirmation link failed</Text>
					<Text style={styles.message}>{message}</Text>
					<TouchableOpacity
						accessibilityRole="button"
						onPress={() => router.replace("/(auth)/login")}
						style={styles.button}
					>
						<Text style={styles.buttonText}>Back to sign in</Text>
					</TouchableOpacity>
				</>
			) : (
				<>
					<ActivityIndicator size="large" color="#f97316" />
					<Text style={styles.title}>Confirming your email...</Text>
				</>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
		backgroundColor: "#f9fafb",
	},
	title: {
		marginTop: 16,
		color: "#111827",
		fontSize: 20,
		fontWeight: "600",
		textAlign: "center",
	},
	message: {
		marginTop: 8,
		color: "#4b5563",
		fontSize: 16,
		textAlign: "center",
	},
	button: {
		marginTop: 24,
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 8,
		backgroundColor: "#3b1b0d",
	},
	buttonText: {
		color: "#ffffff",
		fontSize: 16,
		fontWeight: "600",
	},
});
