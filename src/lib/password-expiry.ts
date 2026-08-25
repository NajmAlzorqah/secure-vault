export interface PasswordAgeInfo {
  ageInDays: number;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  changedAt: Date | null;
  expirationDays: number;
}

/**
 * Checks if a password has expired based on the expiration policy.
 */
export function isPasswordExpired(
  passwordChangedAt: Date | null,
  expirationDays: number,
): boolean {
  if (expirationDays <= 0) return false;
  if (!passwordChangedAt) return true;

  const expiryDate = new Date(
    passwordChangedAt.getTime() + expirationDays * 24 * 60 * 60 * 1000,
  );

  return new Date() > expiryDate;
}

/**
 * Returns detailed information about password age and expiration status.
 */
export function getPasswordAgeInfo(
  passwordChangedAt: Date | null,
  expirationDays: number,
): PasswordAgeInfo {
  if (!passwordChangedAt) {
    return {
      ageInDays: 0,
      isExpired: expirationDays > 0,
      daysUntilExpiry: expirationDays > 0 ? 0 : null,
      changedAt: null,
      expirationDays,
    };
  }

  const ageInDays = Math.floor(
    (Date.now() - passwordChangedAt.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (expirationDays <= 0) {
    return {
      ageInDays,
      isExpired: false,
      daysUntilExpiry: null,
      changedAt: passwordChangedAt,
      expirationDays,
    };
  }

  const expiryDate = new Date(
    passwordChangedAt.getTime() + expirationDays * 24 * 60 * 60 * 1000,
  );
  const daysUntilExpiry = Math.max(
    0,
    Math.floor((expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
  );
  const isExpired = new Date() > expiryDate;

  return {
    ageInDays,
    isExpired,
    daysUntilExpiry,
    changedAt: passwordChangedAt,
    expirationDays,
  };
}
