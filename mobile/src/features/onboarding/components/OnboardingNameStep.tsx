import { StyleSheet } from "react-native-unistyles";
import { View } from "react-native";
import { Text } from "@/shared/components/ui/Text";
import { TextInput } from "@/shared/components/ui/TextInput";
import { Button } from "@/shared/components/ui/Button";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingNameSchema, type OnboardingNameData } from "../schemas/onboarding.schema";
import { useOnboardingStore } from "../stores/onboarding.store";

export function OnboardingNameStep() {
  const { t } = useTranslation("onboarding");
  const { firstName, lastName, setFirstName, setLastName, nextStep } = useOnboardingStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingNameData>({
    resolver: zodResolver(onboardingNameSchema),
    defaultValues: {
      firstName,
      lastName,
    },
  });

  const onSubmit = (data: OnboardingNameData) => {
    setFirstName(data.firstName);
    setLastName(data.lastName);
    nextStep();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="h1" style={styles.title}>
          {t("steps.name.title")}
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          {t("steps.name.subtitle")}
        </Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="firstName"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                label={t("steps.name.firstNameLabel")}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.firstName?.message}
                placeholder={t("steps.name.firstNamePlaceholder")}
                autoFocus
                returnKeyType="next"
              />
            )}
          />

          <View style={styles.inputSeparator} />

          <Controller
            control={control}
            name="lastName"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                label={t("steps.name.lastNameLabel")}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.lastName?.message}
                placeholder={t("steps.name.lastNamePlaceholder")}
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            )}
          />
        </View>
      </View>

      <Button onPress={handleSubmit(onSubmit)} variant="primary">
        {t("continue")}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: theme.spacing(8),
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    marginBottom: theme.spacing(3),
  },
  subtitle: {
    marginBottom: theme.spacing(8),
  },
  form: {
    gap: theme.spacing(4),
  },
  inputSeparator: {
    height: theme.spacing(2),
  },
}));
