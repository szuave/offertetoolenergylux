import { useQuoteStore } from '@/store/quote-store'
import { Card, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'

export function CustomerSection() {
  const customer = useQuoteStore((s) => s.customer)
  const setCustomerField = useQuoteStore((s) => s.setCustomerField)

  return (
    <Card>
      <CardBody className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Voornaam" htmlFor="firstName" required>
            <Input
              id="firstName"
              value={customer.firstName}
              onChange={(e) => setCustomerField('firstName', e.target.value)}
              placeholder="Voornaam"
              autoComplete="given-name"
            />
          </Field>
          <Field label="Achternaam" htmlFor="lastName" required>
            <Input
              id="lastName"
              value={customer.lastName}
              onChange={(e) => setCustomerField('lastName', e.target.value)}
              placeholder="Achternaam"
              autoComplete="family-name"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="E-mail" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              value={customer.email}
              onChange={(e) => setCustomerField('email', e.target.value)}
              placeholder="E-mail"
              autoComplete="email"
            />
          </Field>
          <Field label="Telefoon" htmlFor="phone">
            <Input
              id="phone"
              type="tel"
              value={customer.phone}
              onChange={(e) => setCustomerField('phone', e.target.value)}
              placeholder="Telefoon"
              autoComplete="tel"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_1fr] gap-4">
          <Field label="Straat en nummer" htmlFor="street" required>
            <Input
              id="street"
              value={customer.street}
              onChange={(e) => setCustomerField('street', e.target.value)}
              placeholder="Straat en nummer"
              autoComplete="street-address"
            />
          </Field>
          <Field label="Postcode" htmlFor="postal" required>
            <Input
              id="postal"
              value={customer.postalCode}
              onChange={(e) => setCustomerField('postalCode', e.target.value)}
              placeholder="Postcode"
              maxLength={4}
              inputMode="numeric"
              autoComplete="postal-code"
            />
          </Field>
          <Field label="Gemeente" htmlFor="city" required>
            <Input
              id="city"
              value={customer.city}
              onChange={(e) => setCustomerField('city', e.target.value)}
              placeholder="Gemeente"
              autoComplete="address-level2"
            />
          </Field>
        </div>

        <Field label="Werfadres (als verschillend van factuuradres)" htmlFor="projectAddress">
          <Input
            id="projectAddress"
            value={customer.projectAddress}
            onChange={(e) => setCustomerField('projectAddress', e.target.value)}
            placeholder="Werfadres"
          />
        </Field>
      </CardBody>
    </Card>
  )
}
