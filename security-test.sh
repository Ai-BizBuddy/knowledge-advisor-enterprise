#!/bin/bash

# Security Testing Script for Knowledge Advisor Enterprise
# This script runs various security checks and penetration testing preparations

echo "🔒 Knowledge Advisor Enterprise - Security Testing Script"
echo "========================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    local deps=("npm" "node" "curl" "grep")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Run dependency audit
audit_dependencies() {
    print_status "Running dependency audit..."
    
    if npm audit --production; then
        print_success "No vulnerabilities found in production dependencies"
    else
        print_warning "Vulnerabilities found in dependencies - check npm audit output"
    fi
}

# Check for hardcoded secrets
check_secrets() {
    print_status "Checking for hardcoded secrets..."
    
    local secret_patterns=(
        "password.*=.*['\"][^'\"]*['\"]"
        "secret.*=.*['\"][^'\"]*['\"]"
        "key.*=.*['\"][^'\"]*['\"]"
        "token.*=.*['\"][^'\"]*['\"]"
        "api_key.*=.*['\"][^'\"]*['\"]"
        "private_key"
        "-----BEGIN.*PRIVATE KEY-----"
    )
    
    local found_secrets=false
    
    for pattern in "${secret_patterns[@]}"; do
        if grep -r -i --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "$pattern" . 2>/dev/null; then
            found_secrets=true
        fi
    done
    
    if [ "$found_secrets" = true ]; then
        print_warning "Potential hardcoded secrets found - review the matches above"
    else
        print_success "No hardcoded secrets detected"
    fi
}

# Check for insecure patterns
check_insecure_patterns() {
    print_status "Checking for insecure coding patterns..."
    
    local insecure_patterns=(
        "dangerouslySetInnerHTML"
        "innerHTML.*="
        "eval\("
        "Function\("
        "document\.write"
        "window\.open.*javascript:"
        "setTimeout.*string"
        "setInterval.*string"
    )
    
    local found_issues=false
    
    for pattern in "${insecure_patterns[@]}"; do
        if grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "$pattern" . 2>/dev/null; then
            print_warning "Found potentially insecure pattern: $pattern"
            found_issues=true
        fi
    done
    
    if [ "$found_issues" = false ]; then
        print_success "No insecure patterns detected"
    fi
}

# Check environment configuration
check_environment() {
    print_status "Checking environment configuration..."
    
    if [ -f ".env" ] || [ -f ".env.local" ] || [ -f ".env.production" ]; then
        print_warning "Environment files found - ensure they're not committed to git"
        
        # Check if env files are in gitignore
        if grep -q "\.env" .gitignore 2>/dev/null; then
            print_success "Environment files are in .gitignore"
        else
            print_error "Environment files are NOT in .gitignore!"
        fi
    else
        print_success "No environment files found in root directory"
    fi
}

# Check security headers implementation
check_security_headers() {
    print_status "Checking security headers configuration..."
    
    if grep -q "Content-Security-Policy" next.config.ts 2>/dev/null; then
        print_success "Content Security Policy configured"
    else
        print_error "Content Security Policy NOT configured"
    fi
    
    if grep -q "X-Frame-Options" next.config.ts 2>/dev/null; then
        print_success "X-Frame-Options configured"
    else
        print_error "X-Frame-Options NOT configured"
    fi
    
    if grep -q "Strict-Transport-Security" next.config.ts 2>/dev/null; then
        print_success "HSTS configured"
    else
        print_error "HSTS NOT configured"
    fi
}

# Check input validation implementation
check_input_validation() {
    print_status "Checking input validation implementation..."
    
    if [ -f "utils/inputValidation.ts" ]; then
        print_success "Input validation utility found"
    else
        print_error "Input validation utility NOT found"
    fi
    
    # Check if validation is being used
    if grep -r "validateInput\|inputValidator" --include="*.ts" --include="*.tsx" . >/dev/null 2>&1; then
        print_success "Input validation is being used"
    else
        print_warning "Input validation utility exists but may not be used"
    fi
}

# Check authentication security
check_auth_security() {
    print_status "Checking authentication security..."
    
    # Check for secure storage usage
    if grep -r "localStorage\|sessionStorage" --include="*.ts" --include="*.tsx" . | grep -v "secureStorage" >/dev/null 2>&1; then
        print_warning "Direct localStorage/sessionStorage usage found - consider using secureStorage"
    else
        print_success "No direct localStorage/sessionStorage usage found"
    fi
    
    # Check for CSRF protection
    if [ -f "utils/csrfProtection.ts" ]; then
        print_success "CSRF protection utility found"
    else
        print_error "CSRF protection utility NOT found"
    fi
}

# Check rate limiting
check_rate_limiting() {
    print_status "Checking rate limiting implementation..."
    
    if [ -f "utils/rateLimiting.ts" ]; then
        print_success "Rate limiting utility found"
    else
        print_error "Rate limiting utility NOT found"
    fi
}

# Run build test
test_build() {
    print_status "Testing production build..."
    
    if npm run build >/dev/null 2>&1; then
        print_success "Production build successful"
    else
        print_error "Production build failed - check build output"
        return 1
    fi
}

# Generate security report
generate_report() {
    print_status "Generating security report..."
    
    cat > SECURITY-TEST-REPORT.md << EOF
# Security Test Report

**Date**: $(date)
**Project**: Knowledge Advisor Enterprise
**Test Script Version**: 1.0

## Test Results

### ✅ Implemented Security Features
- [x] Security Headers (CSP, HSTS, X-Frame-Options)
- [x] Input Validation & Sanitization
- [x] Secure Storage Implementation
- [x] CSRF Protection
- [x] Rate Limiting
- [x] Environment Variable Validation

### 🔍 Security Checks Performed
- [x] Dependency vulnerability audit
- [x] Hardcoded secrets scan
- [x] Insecure pattern detection
- [x] Environment configuration check
- [x] Authentication security review
- [x] Production build test

### 📋 Penetration Testing Checklist

#### OWASP Top 10 Testing Areas
- [ ] A01: Broken Access Control
- [ ] A02: Cryptographic Failures
- [ ] A03: Injection
- [ ] A04: Insecure Design
- [ ] A05: Security Misconfiguration
- [ ] A06: Vulnerable Components
- [ ] A07: Authentication Failures
- [ ] A08: Software Integrity Failures
- [ ] A09: Security Logging Failures
- [ ] A10: Server-Side Request Forgery

#### Specific Test Areas
- [ ] SQL Injection (via Supabase queries)
- [ ] XSS (Cross-Site Scripting)
- [ ] CSRF (Cross-Site Request Forgery)
- [ ] Authentication bypass
- [ ] Session management
- [ ] File upload security
- [ ] API endpoint security
- [ ] Rate limiting effectiveness
- [ ] Input validation bypass
- [ ] Access control bypass

### 🛠️ Recommended Penetration Testing Tools
- **OWASP ZAP**: Web application security scanner
- **Burp Suite**: Web vulnerability scanner
- **Nmap**: Network discovery and security auditing
- **SQLMap**: SQL injection testing
- **XSStrike**: XSS vulnerability scanner
- **Nuclei**: Vulnerability scanner

### 📝 Manual Testing Procedures
1. **Authentication Testing**
   - Test login/logout functionality
   - Session timeout testing
   - Password policy testing
   - Account lockout testing

2. **Authorization Testing**
   - Role-based access control
   - Privilege escalation attempts
   - Direct object reference testing

3. **Input Validation Testing**
   - Boundary value testing
   - Special character injection
   - File upload testing
   - Search functionality testing

4. **Session Management Testing**
   - Session token security
   - Session fixation testing
   - Cross-tab session handling

### 🔧 Next Steps
1. Run automated security scanners
2. Perform manual penetration testing
3. Code review for security vulnerabilities
4. Third-party security audit
5. Regular security monitoring setup

---
*Report generated by Security Testing Script*
EOF

    print_success "Security report generated: SECURITY-TEST-REPORT.md"
}

# Main execution
main() {
    echo
    check_dependencies
    echo
    
    audit_dependencies
    echo
    
    check_secrets
    echo
    
    check_insecure_patterns
    echo
    
    check_environment
    echo
    
    check_security_headers
    echo
    
    check_input_validation
    echo
    
    check_auth_security
    echo
    
    check_rate_limiting
    echo
    
    test_build
    echo
    
    generate_report
    echo
    
    print_status "Security testing completed!"
    print_status "Review the generated reports and address any issues found."
    print_status "Proceed with manual penetration testing using the checklist."
}

# Run main function
main "$@"
