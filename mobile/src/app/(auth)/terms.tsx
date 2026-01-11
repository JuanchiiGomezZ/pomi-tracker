import { StyleSheet } from "react-native-unistyles";
import { ScrollView } from "react-native";
import { ScreenWrapper } from "@/shared/components/ui";
import { Text } from "@/shared/components/ui";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TermsScreen() {
  const { t } = useTranslation("auth");

  return (
    <ScreenWrapper scroll edges={["top", "bottom"]}>
      <Text variant="h2" style={styles.title}>
        {t("login.terms_of_service")}
      </Text>

      <Text variant="body" color="secondary" style={styles.lastUpdated}>
        Last updated: January 2026
      </Text>

      <Text variant="body" style={styles.section}>
        By accessing or using DailyLoop, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>1. Acceptance of Terms</Text>
        {"\n\n"}
        By downloading, installing, or using DailyLoop, you accept and agree to be bound by these Terms of Service and our Privacy Policy.
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>2. Account Registration</Text>
        {"\n\n"}
        To use DailyLoop, you must sign in with a valid Google or Apple account. You are responsible for maintaining the confidentiality of your account credentials.
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>3. User Content</Text>
        {"\n\n"}
        You retain ownership of any data you input into DailyLoop. We do not claim ownership over your habit tracking data.
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>4. Prohibited Conduct</Text>
        {"\n\n"}
        You agree not to: (a) use the service for any unlawful purpose; (b) attempt to gain unauthorized access to our systems; (c) interfere with or disrupt the service.
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>5. Termination</Text>
        {"\n\n"}
        We may terminate or suspend your account at our sole discretion, without prior notice, for conduct that we believe violates these Terms of Service.
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>6. Limitation of Liability</Text>
        {"\n\n"}
        DailyLoop is provided "as is" without any warranties, express or implied. We are not liable for any damages arising from your use of the application.
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>7. Changes to Terms</Text>
        {"\n\n"}
        We reserve the right to modify these terms at any time. Continued use of DailyLoop after any changes constitutes acceptance of the new terms.
      </Text>

      <Text variant="body" style={styles.section}>
        <Text style={styles.bold}>8. Contact</Text>
        {"\n\n"}
        If you have questions about these Terms, please contact us through the app settings.
      </Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create((theme) => ({
  title: {
    marginBottom: theme.spacing(2),
  },
  lastUpdated: {
    marginBottom: theme.spacing(6),
  },
  section: {
    marginBottom: theme.spacing(6),
    lineHeight: 22,
  },
  bold: {
    fontFamily: theme.fontFamily.semibold,
  },
}));
