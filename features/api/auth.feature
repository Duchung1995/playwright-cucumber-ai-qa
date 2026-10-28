@api @auth @REQ-API-01
Feature: Authentication API
  As an API consumer
  I want to exchange credentials for a JWT
  So that I can call protected endpoints

  # Login scenarios use a throwaway customer: the site locks an account after repeated failed logins,
  # and the shared demo customer is used (and locked) by everyone testing this public instance.

  @smoke
  Scenario: Customer logs in with valid credentials and gets a usable token
    Given a new customer is registered via the API
    When I log in via the API as the "new customer" user
    Then the response status should be 200
    And the response body should match the "login token" schema
    When I request my profile with the issued token
    Then the response status should be 200
    And the response body should match the "user" schema
    And the profile email should belong to the "new customer" user

  Scenario: Login is rejected for a wrong password
    Given a new customer is registered via the API
    When I log in via the API as the "new customer" user with password "not-it-1!"
    Then the response status should be 401
    And the response body field "error" should equal "Unauthorized"
    And no access token should be issued

  Scenario Outline: Login is rejected for invalid credentials (<case>)
    When I log in via the API with email "<email>" and password "<password>"
    Then the response status should be 401
    And the response body field "error" should equal "<error>"
    And no access token should be issued

    Examples:
      | case           | email                                | password  | error                 |
      | unknown user   | nobody-qa@example.com                | welcome01 | Unauthorized          |
      | empty body     |                                      |           | Invalid login request |

  Scenario Outline: Protected profile endpoint rejects <case>
    When I request my profile with token "<token>"
    Then the response status should be 401
    And the response body field "message" should equal "Unauthorized"

    Examples:
      | case             | token       |
      | a missing token  |             |
      | a forged token   | abc.def.ghi |
