This is a website dedicated to KC tools and applications.

Ship data extraction and comparison can be found in /CompareShip.html
Fleet optimisation can be found in /index.html

Fleet optimisation:

Given certain constraints for fleet composition, and some objective function defined by the user, a mixed integer linear program can be formulated and solved to find the optimal fleet.
Constraints are typically in the form " a < n(Class) < b ", which can be graphically input by the user.
Other more exotic constraints have their own section, including AACI and OASW.
The objective function is currently a choice of maximisation of some chosen stat, which can be different for each fleet.

The user can choose to optimise for several fleets simultaneously. There is no weighting system in place for the multiple objectives however, so use with caution.
This fleet optimisation tool is still very much in development. Please exercise common sense when considering the output, and consider it a starting point only.
