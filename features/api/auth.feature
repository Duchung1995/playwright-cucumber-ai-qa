@api @auth @REQ-API-01
Feature: Authentication API
  As an API consumer
  I want to exchange credentials for a JWT
  So that I can call protected endpoints

  @smoke
  Scenario: Customer logs in with valid credentials and gets a usable token
    When I log in via the API as the "customer" user
    Then the response status should be 200
    And the response body should match the "login token" schema
    When I request my profile with the issued token
    Then the response status should be 200
    And the response body should match the "user" schema
    And the profile email should belong to the "customer" user

  Scenario Outline: Login is rejected for invalid credentials (<case>)
    When I log in via the API with email "<email>" and password "<password>"
    Then the response status should be 401
    And the response body field "error" should equal "<error>"
    And no access token should be issued

    Examples:
      | case           | email                                | password  | error                 |
      | wrong password | customer@practicesoftwaretesting.com | not-it-1! | Unauthorized          |
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
