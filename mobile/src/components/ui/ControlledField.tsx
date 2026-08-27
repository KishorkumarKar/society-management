import React from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { TextInputProps } from 'react-native';
import { FormField } from './FormField';

interface ControlledFieldProps<T extends FieldValues> extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  error?: string;
}

/**
 * Every create/edit form in the app (users, roles, flats, expenses,
 * announcements, maintenance bills) is react-hook-form + zod, same as
 * LoginScreen/ContactScreen — this is that pairing factored out once
 * instead of re-declared per screen.
 */
export function ControlledField<T extends FieldValues>({
  control,
  name,
  label,
  error,
  ...rest
}: ControlledFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <FormField
          label={label}
          error={error}
          value={value != null ? String(value) : ''}
          onChangeText={onChange}
          onBlur={onBlur}
          {...rest}
        />
      )}
    />
  );
}
