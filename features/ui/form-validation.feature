@ui @validation @REQ-UI-02
Feature: Registration and login form validation
  As a visitor
  I want clear feedback on invalid input
  So that I can correct my details before submitting

  Scenario: Submitting an empty registration form flags every required field
    Given I am on the registration page
    When I submit the registration form
    Then the following registration fields should show an error:
      | field        | message                    |
      | first name   | First name is required     |
      | last name    | Last name is required      |
      | country      | Country is required        |
      | postal code  | Postcode is required       |
      | house number | House number is required   |
      | street       | Street is required         |
      | city         | City is required           |
      | state        | State is required          |
      | phone        | Phone is required.         |
      | email        | Email is required          |
      | password     | Password is required       |
    And the "email" registration field should be highlighted as invalid

  Scenario Outline: Registration rejects an invalid <field>
    Given I am on the registration page
    When I enter "<value>" into the "<field>" registration field
    And I submit the registration form
    Then the "<field>" registration field should show the error "<message>"
    And the "<field>" registration field should be highlighted as invalid

    Examples:
      | field    | value        | message                                    |
      | email    | not-an-email | Email format is invalid                    |
      | password | abc12        | Password must be minimal 6 characters long |
      | phone    | 06-CALL-ME   | Only numbers are allowed.                  |

  Scenario: Login with a wrong password shows an error banner
    Given I am on the login page
    When I log in with the "customer" email and password "wrong-password-1"
    Then I should see the login error "Invalid email or password"
    And I should still be on the login page
