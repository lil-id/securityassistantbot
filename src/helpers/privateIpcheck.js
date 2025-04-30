function isPrivateIP(ip) {
    return (
      /^127\./.test(ip) ||                  // loopback
      /^10\./.test(ip) ||                   // class A
      /^192\.168\./.test(ip) ||             // class C
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip) || // class B
      ip === '::1'
    );
}

export default isPrivateIP;